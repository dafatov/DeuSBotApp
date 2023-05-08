const {getFixedT} = require('i18next');
const {spell} = require('./string');

module.exports.timeFormatSeconds = s => {
  const time = new Date(0, 0, 0, 0, 0, s);

  return time.getTime() < new Date(0, 0, 1).getTime()
    ? time.toLocaleTimeString('en-GB')
    : null;
};

module.exports.timeFormatMilliseconds = ms => {
  const time = new Date(0, 0, 0, 0, 0, 0, ms);

  return time.getTime() < new Date(0, 0, 1).getTime()
    ? time.toLocaleTimeString('en-GB')
    : null;
};

module.exports.localePostgresInterval = postgresInterval => {
  if (!postgresInterval || Object.keys(postgresInterval).length < 1) {
    return '0';
  }

  return Object.keys(postgresInterval)
    .map(key => spell(postgresInterval[key], Object.values(getFixedT(null, null, 'common:time')(key, {returnObjects: true}).name)))
    .join(' ');
};

module.exports.comparePostgresInterval = (a, b, isDescending = false) => {
  const keys = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];
  const mapPostgresInterval = interval => keys.reduce((acc, key) => ({
    ...acc,
    [key]: interval[key] ?? 0,
  }), {});

  a = mapPostgresInterval(a);
  b = mapPostgresInterval(b);

  // eslint-disable-next-line no-loops/no-loops
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return (isDescending
        ? -1
        : 1) * (a[key] - b[key]);
    }
  }

  return 0;
};

module.exports.isExactlyTime = (now, hours, minutes) => {
  const targetDate = new Date();

  targetDate.setUTCHours(hours, minutes);

  return now.getUTCHours() === targetDate.getUTCHours() && now.getUTCMinutes() === targetDate.getUTCMinutes();
};
