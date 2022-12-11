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
