# Forta Workshop 2: ICHI V2 Large Swap Agent

## Description

This Forta Bot checks incoming Eth Mainnet blocks to detect anomolously large swaps on ICHI Angel Vaults. 

## Supported Chains

- Ethereum Mainnet

## Alerts

- ICHI Forta 1 - Large Deposit to AV Made 
- ICHI Forta 2 - Large Withdrawal to AV Made


## Test Data

The agent behavior can be verified with the following transactions (`npm run tx <tx_hash>`):
- 0x38b21ffb98360bf90db75bb72149f79866ee1e42bf3afb94bbe3d669c6f50016
- 0xbcb6a66c79876e2c62bc7ea39beba140c0ccb7a36f764dd926561fc9c367b11c
- 0x2164c2353d31d5073b2d8bf57ea1e0f682429b30edc21c6129b1390d6c38a3c3
