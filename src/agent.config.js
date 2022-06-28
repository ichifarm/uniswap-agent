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
  getAverage: (array) => {
    const total = array.reduce((acc, c) => acc + c, 0);
    return total / array.length;
  },
};
