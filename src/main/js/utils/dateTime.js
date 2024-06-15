const {getFixedT} = require('i18next');
const {spell} = require('./string');
const zip = require('lodash/zip');

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

module.exports.comparePostgresIntervals = (a, b) => {
  const keys = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];
  const mapPostgresInterval = interval => keys.reduce((acc, key) => ([
    ...acc,
    interval[key] ?? 0,
  ]), []);

  a = mapPostgresInterval(a);
  b = mapPostgresInterval(b);

  return zip(a, b)
    .reduce((acc, [aPart, bPart]) =>
      acc !== 0 || aPart === bPart
        ? acc
        : aPart - bPart, 0);
};

module.exports.youtubeDurationToSeconds = duration => duration
  .match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  .slice(1)
  .reduce((acc, item, index) => acc + (item ?? 0) * Math.pow(60, 2 - index), 0);

module.exports.isExactlyTime = (now, hours, minutes) => {
  const targetDate = new Date();

  targetDate.setUTCHours(hours, minutes);

  return now.getUTCHours() === targetDate.getUTCHours() && now.getUTCMinutes() === targetDate.getUTCMinutes();
};
