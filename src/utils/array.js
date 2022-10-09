module.exports.shuffleArray = array => {
  let j, tmp;

  for (let i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    tmp = array[j];
    array[j] = array[i];
    array[i] = tmp;
  }
  return array;
};

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
