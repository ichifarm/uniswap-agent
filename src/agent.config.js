/*
Will need to 
- Create a mapping of every single pool address 
- For each address, we store SMA and number of transactions included 
- If value is not outlier, add it to database 
- Check for outlier values using moving average 
- Text user 
*/

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
