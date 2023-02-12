const fileSystemApi = require('i18next-fs-backend');
const i18next = require('i18next');
const locale = require('../../../main/js/configs/locale');

module.exports.init = () => locale.init()
  .then(config => i18next
    .use(fileSystemApi)
    .init({
      ...config,
      backend: {
        loadPath: './src/main/resources/locales/{{lng}}/{{ns}}.json',
      },
      saveMissing: false,
    }));
