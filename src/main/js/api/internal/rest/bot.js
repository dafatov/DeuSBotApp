const {t} = require('i18next');
const {version} = require('../../../../../../package.json');

module.exports = {
  execute({app}) {
    app.get('/', (_req, res) =>
      res.send(t('web:about', {version})));
  },
};
