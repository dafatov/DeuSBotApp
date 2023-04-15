module.exports.ifPromise = (condition, positive, negative) =>
  new Promise(resolve => resolve(condition
    ? positive
    : negative));

module.exports.throughPromise = (through, callback) =>
  new Promise(resolve => {
    callback?.();
    resolve(through);
  });
