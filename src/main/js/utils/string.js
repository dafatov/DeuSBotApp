const {t} = require('i18next');

module.exports.escaping = str => {
  const symbols = ['\\', '_', '*', '~', '>', '<', '|'];

  symbols.forEach(s => {
    str = str.replaceAll(s, `\\${s}`);
  });

  return str;
};

module.exports.isVersionUpdated = (versionOld, versionNew) => {
  versionOld = versionOld.split('.').map(v => parseInt(v));
  versionNew = versionNew.split('.').map(v => parseInt(v));

  if (versionOld.length !== versionNew.length) {
    throw t('inner:error.version');
  }

  if (versionOld[0] !== versionNew[0]) {
    return versionOld[0] < versionNew[0];
  }

  if (versionOld[1] !== versionNew[1]) {
    return versionOld[1] < versionNew[1];
  }

  return versionOld[2] < versionNew[2];
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

module.exports.getCommandName = path => path.split('\\').slice(-1)[0].replace('.js', '');
