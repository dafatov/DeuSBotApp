module.exports.timeFormatSeconds = s => {
  const time = new Date(0, 0, 0, 0, 0, s);

  return time.toLocaleTimeString('en-GB');
};

module.exports.timeFormatMilliseconds = ms => {
  const time = new Date(0, 0, 0, 0, 0, 0, ms);

  return time.toLocaleTimeString('en-GB');
};
