const {getFixedT} = require('i18next');
const {spell} = require('./string');

module.exports.timeFormatSeconds = s => {
  const time = new Date(0, 0, 0, 0, 0, s);

  return time.toLocaleTimeString('en-GB');
};

module.exports.timeFormatMilliseconds = ms => {
  const time = new Date(0, 0, 0, 0, 0, 0, ms);

  return time.toLocaleTimeString('en-GB');
};

module.exports.localePostgresInterval = postgresInterval => {
  if (Object.keys(postgresInterval).length < 1) {
    return '0';
  }

  return Object.keys(postgresInterval)
    .map(key => spell(postgresInterval[key], Object.values(getFixedT(null, null, 'common:time')(key, {returnObjects: true}).name)))
    .join(' ');
};

module.exports.comparePostgresInterval = (a, b, isDescending = false) => {
  const mapPostgresInterval = interval => interval.toISOString()
    .replace('T', '')
    .split(new RegExp('[A-Z]'))
    .slice(1, -1);

  a = mapPostgresInterval(a);
  b = mapPostgresInterval(b);

  // eslint-disable-next-line no-loops/no-loops
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return (isDescending
        ? -1
        : 1) * (a[i] - b[i]);
    }
  }

  return 0;
};
