module.exports.ifPromise = (condition, positive, negative) =>
  new Promise(resolve => resolve(condition
    ? positive
    : negative));
