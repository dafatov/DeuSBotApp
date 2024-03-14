module.exports.ifPromise = (condition, positive, negative) =>
  new Promise(resolve => resolve(condition
    ? positive()
    : (negative?.() ?? Promise.resolve())));

module.exports.throughPromise = (through, callback) =>
  new Promise(resolve => {
    callback?.();
    resolve(through);
  });

module.exports.throughThrow = (error, callback) =>
  new Promise((_, reject) => {
    callback?.();
    reject(new Error(error));
  });

module.exports.booleanToPromise = boolean =>
  new Promise((resolve, reject) =>
    boolean
      ? resolve()
      : reject(),
  );
