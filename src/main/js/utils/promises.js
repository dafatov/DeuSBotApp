module.exports.ifPromise = (condition, positive, negative) =>
  new Promise(resolve => resolve(condition
    ? positive()
    : (negative?.() ?? Promise.resolve())));

module.exports.throughPromise = (through, callback) =>
  new Promise(resolve => {
    callback?.();
    resolve(through);
  });
