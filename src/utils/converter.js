module.exports.timeFormatSeconds = (s) => {
  let time = new Date(0, 0, 0, 0, 0, s);

  return time.toLocaleTimeString('en-GB');
}

module.exports.timeFormatmSeconds = (ms) => {
  let time = new Date(0, 0, 0, 0, 0, 0, ms);

  return time.toLocaleTimeString('en-GB');
}