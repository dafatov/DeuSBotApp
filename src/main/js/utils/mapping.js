module.exports.bigIntReplacer = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  } else {
    return value;
  }
};
