module.exports = {
  input: [
    'src/**/*.{js,jsx}'
  ],
  output: './',
  options: {
    debug: true,
    func: {
      list: ['t'],
      extensions: ['.js'],
    },
    lngs: ['ru'],
    ns: ['common', 'web', 'inner', 'discord'],
    defaultLng: 'ru',
    defaultNs: 'inner',
    defaultValue: '__STRING_NOT_TRANSLATED__',
    resource: {
      savePath: './i18Scanner/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },
    nsSeparator: ':',
    keySeparator: '.',
    interpolation: {
      prefix: '{{',
      suffix: '}}',
    },
    plural: false,
    sort: true,
    context: false
  }
};
