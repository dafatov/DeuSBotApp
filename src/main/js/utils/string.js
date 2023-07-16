const {t} = require('i18next');
const zip = require('lodash/zip');

module.exports.escaping = str => {
  const symbols = ['\\', '_', '*', '~', '>', '<', '|'];

  symbols.forEach(s => {
    str = str.replaceAll(s, `\\${s}`);
  });

  return str;
};

module.exports.compareVersions = (a, b) => {
  const mapVersion = version => version
    .split('.')
    .map(versionPart => parseInt(versionPart));

  a = mapVersion(a);
  b = mapVersion(b);

  if (a.length !== b.length) {
    throw t('inner:error.version');
  }

  return zip(a, b)
    .reduce((acc, [aPart, bPart]) =>
      acc !== 0 || aPart === bPart
        ? acc
        : aPart - bPart, 0);
};

module.exports.stringify = object => {
  if (typeof object === 'object') {
    return JSON.stringify(object, Object.getOwnPropertyNames(object), 2)
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n');
  }
  return object;
};

module.exports.padEnum = (item, enumeration) => {
  const max = Math.max(...Object.values(enumeration).map(e => e.length));

  return item.padStart(max, ' ');
};

module.exports.spell = (number, wordForms) => {
  number = Math.abs(number);

  if (Number.isInteger(number)) {
    const options = [2, 0, 1, 1, 1, 2];

    return `${number} ${wordForms[(number % 100 > 4 && number % 100 < 20)
      ? 2
      : options[(number % 10 < 5)
        ? number % 10
        : 5]]}`;
  }

  return `${number} ${wordForms[1]}`;
};

module.exports.toFirstUpperCase = string => {
  if (!string || string.length < 1) {
    return string;
  }

  return string[0].toUpperCase() + string.slice(1);
};

module.exports.getCommandName = path => path.split(/[/\\]/).slice(-1)[0].replace('.js', '');

module.exports.getStackTrace = error => error.stack.split('\n').splice(2).join('\n');
