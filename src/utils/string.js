module.exports.escaping = (str) => {
  const symbols = ['\\', '_', '*', '~', '>', '<', '|'];

  symbols.forEach(s => {
    str = str.replaceAll(s, `\\${s}`);
  })

  return str;
}

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
}