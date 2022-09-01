module.exports.escaping = (str) => {
  const symbols = ['\\', '_', '*', '~', '>', '<', '|'];

  symbols.forEach(s => {
    str = str.replaceAll(s, `\\${s}`);
  });

  return str;
};

module.exports.parseAnisonResponseOnAir = (onAir) => {
  const res = {};
  const mark1 = `'_blank'>`;
  const mark2 = `</a>`;
  const mark3 = `</span>`;

  let iMark1 = onAir.indexOf(mark1);
  let iMark2 = onAir.indexOf(mark2);
  let iMark3 = onAir.indexOf(mark3);

  res.source = onAir.substring(iMark1 + mark1.length, iMark2);
  res.title = onAir.substring(iMark2 + mark2.length + 8, iMark3);
  return res;
};

module.exports.isVersionUpdated = (versionOld, versionNew) => {
  versionOld = versionOld.split('.').map(v => parseInt(v));
  versionNew = versionNew.split('.').map(v => parseInt(v));

  if (versionOld.length !== versionNew.length) {
    throw 'Version has wrong format';
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
