const fileSystemApi = require('i18next-fs-backend');
const i18next = require('i18next');

module.exports.init = () => i18next
  .use(fileSystemApi)
  .init({
    backend: {
      loadPath: 'src/main/resources/locales/{{lng}}/{{ns}}.json',
      addPath: 'src/main/resources/locales/{{lng}}/_{{ns}}.json',
    },
    debug: process.env.LOGGING === 'DEBUG',
    defaultNS: 'inner',
    fallbackLng: ['ru'],
    interpolation: {
      escapeValue: false,
    },
    lng: 'ru',
    load: 'currentOnly',
    ns: ['inner', 'common', 'discord', 'web'],
    saveMissing: true,
    supportedLngs: ['en', 'ru'],
  });
