module.exports.timeFormatSeconds = (s) => {
  let time = new Date(0, 0, 0, 0, 0, s);

  return time.toLocaleTimeString('en-GB');
}

module.exports.timeFormatmSeconds = (ms) => {
  let time = new Date(0, 0, 0, 0, 0, 0, ms);

  return time.toLocaleTimeString('en-GB');
}

module.exports.dateTime = (
  now,
  minutes = null,
  hours = null,
  date = null,
  month = null,
  year = null
) => {
  return new Date(
    year ?? now.getFullYear(),
    month ?? now.getMonth(),
    date ?? now.getDate(),
    hours ?? now.getHours(),
    minutes ?? now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
}

module.exports.parseStr = (s) => {
  if (!s) {
    return s;
  }
  return new Date(Date.parse(s)).toLocaleDateString();
}