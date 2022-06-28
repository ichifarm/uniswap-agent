// Set of normative deposit values
const depositTrainingData = [
  2.00e+23,
];

// Set of normative withdrawal values
const withdrawalTrainingData = [
  7.00e+21,
];

module.exports = {
  depositTrainingData: depositTrainingData,
  withdrawalTrainingData: withdrawalTrainingData,
  getAverage: (array) => {
    const total = array.reduce((acc, c) => acc + c, 0);
    return total / array.length;
  },
};
