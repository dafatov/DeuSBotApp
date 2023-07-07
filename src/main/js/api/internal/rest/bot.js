const {t} = require('i18next');

module.exports = {
  execute({app}) {
    app.get('/', (_req, res) =>
      res.send(t('web:about', {version: process.env.npm_package_version})));
  },
};
