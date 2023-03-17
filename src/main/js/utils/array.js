module.exports.arrayMoveMutable = (array, fromIndex, toIndex) => {
  const startIndex = fromIndex < 0
    ? array.length + fromIndex
    : fromIndex;

  if (startIndex >= 0 && startIndex < array.length) {
    const endIndex = toIndex < 0
      ? array.length + toIndex
      : toIndex;

    const [item] = array.splice(fromIndex, 1);
    array.splice(endIndex, 0, item);
  }
};

module.exports.chunk = (array, chunkSize) => Array(Math.ceil(array.length / chunkSize)).fill()
  .map((_, index) => array.slice(index * chunkSize, index * chunkSize + chunkSize));
