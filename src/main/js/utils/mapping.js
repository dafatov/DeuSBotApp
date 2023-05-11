module.exports.bigIntReplacer = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  } else {
    return value;
  }
};

module.exports.promiseAllSequence = functions => {
  const results = [];

  return (async () => {
    // eslint-disable-next-line no-loops/no-loops
    for (const func of functions) {
      results.push(await func());
    }

    return Promise.resolve(results);
  })();
};
