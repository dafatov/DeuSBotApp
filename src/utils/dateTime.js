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

module.exports.localeMonth = (month) => {
  switch (month) {
    case 0:
      return 'Январь';
    case 1:
      return 'Февраль';
    case 2:
      return 'Март';
    case 3:
      return 'Апрель';
    case 4:
      return 'Май';
    case 5:
      return 'Июнь';
    case 6:
      return 'Июль';
    case 7:
      return 'Август';
    case 8:
      return 'Сентябрь';
    case 9:
      return 'Октябрь';
    case 10:
      return 'Ноябрь';
    case 11:
      return 'Декабрь';
    default:
      return 'ERROR';
  }
}