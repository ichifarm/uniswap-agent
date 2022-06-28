// Set of normative deposit values
const depositTrainingData = [
    0,
    0,
    0,
    0,
    0,
];

// Set of normative withdrawal values
const withdrawalTrainingData = [
    0,
    0,
    0,
    0,
    0,
];

module.exports = {
  depositTrainingData: depositTrainingData,
  withdrawalTrainingData: withdrawalTrainingData,
  getDepositAverage: () => {
    const total = depositTrainingData.reduce((acc, c) => acc + c, 0);
    return total / depositTrainingData.length;
  },
  getWithdrawalAverage: () => {
    const total = withdrawalTrainingData.reduce((acc, c) => acc + c, 0);
    return total / withdrawalTrainingData.length;
  }, 
};
