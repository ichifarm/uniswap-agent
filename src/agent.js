const BigNumber = require("bignumber.js");
const {
  Finding,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} = require("forta-agent");

const {
  depositTrainingData,
  getAverage,
  withdrawalTrainingData,
} = require("./agent.config");

// use ethers.js for contracts, interfaces, and provider
const ethers = require("ethers");

// load any agent configuration parameters
const config = require("../agent-config.json");

// load contract addresses
const contractAddresses = require("../contract-addresses.json");

// load contract ABIs
const factoryAbi = require("../abi/ICHIVaultFactory.json");
const vaultAbi = require("../abi/ICHIVault.json");

// create object that will contain contracts, providers, interfaces, and configuration parameters
const initializeData = {};

function provideInitialize(data) {
  return async function initialize() {
    // set up an ethers.js provider for interacting with contracts
    // getJsonRpcUrl() will return the JSON-RPC URL from forta.config.json
    data.provider = new ethers.providers.JsonRpcBatchProvider(getJsonRpcUrl());

    // create an ethers.js Contract object for calling methods on the ICHI Vault Factory contract
    data.factoryContract = new ethers.Contract(
      contractAddresses.ICHIVaultFactory.address,
      factoryAbi,
      data.provider
    );

    // store the deposit threshold as a BigNumber (NOT ethers.js BigNumber)
    data.depositThresholdUSDBN = new BigNumber(
      config.largeDeposit.thresholdUSD
    );

    // store the withdrawal threshold as a BigNumber (NOT ethers.js BigNumber)
    data.withdrawalThresholdUSDBN = new BigNumber(
      config.largeWithdrawal.thresholdUSD
    );

    data.timestamp = Date.now() / 1000;

    // store the ICHI Vault contract ABI for use later
    data.vaultAbi = vaultAbi;
    /* eslint-enable no-param-reassign */
  };
}

function provideHandleTransaction(data) {
  return async function handleTransaction(txEvent) {
    // destructure the initialized data for use in handler
    const {
      vaultAbi: vaultAbi,
      provider,
      factoryContract,
      depositThresholdUSDBN,
      withdrawalThresholdUSDBN,
      timestamp,
    } = data;

    if (!factoryContract)
      throw new Error("handleTransaction called before initialization");

    // initialize the findings Array
    const findings = [];

    // check for logs containing the Deposit event signature {ICHI Vault}
    const depositSignature = "Deposit(address,address,uint256,uint256,uint256)";
    const depositLogs = txEvent.filterEvent(depositSignature);

    // check for logs containing the Withdraw event signature {ICHI Vault}
    const withdrawSignature =
      "Withdraw(address,address,uint256,uint256,uint256)";
    const withdrawLogs = txEvent.filterEvent(withdrawSignature);

    // no deposits to the vaults, no findings
    if (depositLogs.length > 0) {
      // iterate over the logs containing deposit events and return an Array of promises
      const depositPromises = depositLogs.map(async (depositLog) => {
        // destructure the log
        const { address, data: eventData, topics } = depositLog;

        // create an ethers.js Contract with the given address and the poolAbi
        const vaultContract = new ethers.Contract(address, vaultAbi, provider);

        let deployer;
        let token0;
        let token1;
        let fee;
        let allowToken0;
        let allowToken1;
        try {
          // get the parameters that define the ICHI Vault
          deployer = await vaultContract.owner();
          token0 = await vaultContract.token0();
          token1 = await vaultContract.token1();
          fee = await vaultContract.fee();
          allowToken0 = await vaultContract.allowToken0();
          allowToken1 = await vaultContract.allowToken1();

          // Generate the key for ICHI Vault from data
          const ichiVaultKey = await data.factoryContract.genKey(
            deployer,
            token1,
            token0,
            fee,
            allowToken1,
            allowToken0
          );

          // use the ICHI Vault Factory to get the pool address based on a key
          const expectedAddress = await data.factoryContract.getICHIVault(
            ichiVaultKey
          );

          if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
            // if the addresses do not match, assume that this is not an ICHI Vault
            return undefined;
          }
        } catch {
          // if an error was encountered calling contract methods
          // assume that this is not a ICHI Vault
          return undefined;
        }

        // parse the information from the deposit invocation
        const {
          args: { sender, to, shares, amount0, amount1 },
        } = vaultContract.interface.parseLog({
          data: eventData,
          topics,
        });

        // convert from ethers.js BigNumber to BigNumber.js
        const amount0BN = new BigNumber(amount0.toHexString());
        const amount1BN = new BigNumber(amount1.toHexString());

        const depositData = {
          address,
          amount0BN,
          amount1BN,
          sender,
          value0USDBN: new BigNumber(0),
          value1USDBN: new BigNumber(0),
          timestamp: txEvent.timestamp,
        };

        return depositData;
      });

      // settle the promises
      // NOTE: Promise.all will fail fast on any rejected promises
      // Consider Promise.allSettled() to ensure that all promises settle (fulfilled or rejected)
      let depositResults = await Promise.all(depositPromises);

      // filter out undefined entries in the results
      depositResults = depositResults.filter((result) => result !== undefined);

      // check each deposit for any that exceeded the threshold value
      depositResults.forEach((result) => {
        const averageDeposit = new BigNumber(getAverage(depositTrainingData));
        if (
          result.amount0BN
            .plus(result.amount1BN)
            .minus(averageDeposit)
            .div(averageDeposit)
            .gte(depositThresholdUSDBN)
        ) {
          const finding = Finding.fromObject({
            name: "ICHI Depoit: Large Deposit Made",
            description: `Large Deposit from pool ${result.address}`,
            alertId: "ICHI Forta 1 - Large Deposit to AV Made",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            protocol: "ICHIV2",
            metadata: {
              address: result.address,
              token0Amount: result.amount0BN.toString(),
              token1Amount: result.amount1BN.toString(),
              sender: result.sender,
              value0USD: result.value0USDBN.toString(),
              value1USD: result.value1USDBN.toString(),
              depositThresholdUSD: depositThresholdUSDBN.toString(),
              timestamp: Date(txEvent.timestamp),
            },
          });
          findings.push(finding);
        } else {
          depositTrainingData.push(result.amount0BN.plus(result.amount1BN));
        }
      });
    }

    // check each withdrawal for any that exceeded the threshold value
    if (withdrawLogs.length > 0) {
      // iterate over the logs containing Flash events and return an Array of promises
      const withdrawPromises = withdrawLogs.map(async (withdrawLog) => {
        // destructure the log
        const { address, data: eventData, topics } = withdrawLog;

        // create an ethers.js Contract with the given address and the poolAbi
        const vaultContract = new ethers.Contract(address, vaultAbi, provider);

        let deployer;
        let token0;
        let token1;
        let fee;
        let allowToken0;
        let allowToken1;
        try {
          // get the parameters that define the ICHI Vault
          deployer = await vaultContract.owner();
          token0 = await vaultContract.token0();
          token1 = await vaultContract.token1();
          fee = await vaultContract.fee();
          allowToken0 = await vaultContract.allowToken0();
          allowToken1 = await vaultContract.allowToken1();

          // Generate the key for ICHI Vault from data
          const ichiVaultKey = await data.factoryContract.genKey(
            deployer,
            token1,
            token0,
            fee,
            allowToken1,
            allowToken0
          );

          // use the ICHI Vault Factory to get the pool address based on a key
          const expectedAddress = await data.factoryContract.getICHIVault(
            ichiVaultKey
          );

          if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
            // if the addresses do not match, assume that this is not an ICHI Vault
            return undefined;
          }
        } catch {
          // if an error was encountered calling contract methods
          // assume that this is not a ICHI Vault
          return undefined;
        }

        // parse the information from the withdrawal invocation
        const {
          args: { sender, to, shares, amount0, amount1 },
        } = vaultContract.interface.parseLog({
          data: eventData,
          topics,
        });

        // convert from ethers.js BigNumber to BigNumber.js
        const amount0BN = new BigNumber(amount0.toHexString());
        const amount1BN = new BigNumber(amount1.toHexString());

        const withdrawData = {
          address,
          amount0BN,
          amount1BN,
          sender,
          value0USDBN: new BigNumber(0),
          value1USDBN: new BigNumber(0),
          timestamp: txEvent.timestamp,
        };

        return withdrawData;
      });

      // settle the promises
      // NOTE: Promise.all will fail fast on any rejected promises
      // Consider Promise.allSettled() to ensure that all promises settle (fulfilled or rejected)
      let withdrawResults = await Promise.all(withdrawPromises);

      // filter out undefined entries in the results
      withdrawResults = withdrawResults.filter(
        (result) => result !== undefined
      );

      // check each flash swap for any that exceeded the threshold value
      withdrawResults.forEach((result) => {
        const averageWithdrawal = new BigNumber(
          getAverage(withdrawalTrainingData)
        );
        console.log(averageWithdrawal.toNumber());
        console.log(
          result.amount0BN
            .plus(result.amount1BN)
            .minus(averageWithdrawal)
            .div(averageWithdrawal)
            .toNumber()
        );
        if (
          result.amount0BN
            .plus(result.amount1BN)
            .minus(averageWithdrawal)
            .div(averageWithdrawal)
            .gte(withdrawalThresholdUSDBN)
        ) {
          const finding = Finding.fromObject({
            name: "ICHI Depoit: Large Withdrawal Made",
            description: `Large Withdrawal from pool ${result.address}`,
            alertId: "ICHI Forta 2 - Large Withdrawal to AV Made",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            protocol: "ICHIV2",
            metadata: {
              address: result.address,
              token0Amount: result.amount0BN.toString(),
              token1Amount: result.amount1BN.toString(),
              sender: result.sender,
              value0USD: result.value0USDBN.toString(),
              value1USD: result.value1USDBN.toString(),
              withdrawalThresholdUSD: withdrawalThresholdUSDBN.toString(),
              timestamp: Date(txEvent.timestamp),
            },
          });
          findings.push(finding);
        } else {
          withdrawalTrainingData.push(result.amount0BN.plus(result.amount1BN));
        }
      });
    }
    return findings;
  };
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(initializeData),
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(initializeData),
};
