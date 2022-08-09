const {getLast, add} = require('../repositories/changelog');
const changelog = require('../configs/changelog');
const {parseVersion} = require('../utils/string');
const {audit, TYPES, CATEGORIES} = require('../actions/auditor');

module.exports.init = async () => {
  if (!changelog.isPublic || ((await getLast())?.version ?? 0) >= parseVersion(process.env.HEROKU_RELEASE_VERSION)) {
    return;
  }
  const message = JSON.stringify(changelog.message);

  if ((await getLast())?.message !== message) {
    await add(parseVersion(process.env.HEROKU_RELEASE_VERSION), message)
      .then(() => audit({
        guildId: null,
        type: TYPES.INFO,
        category: CATEGORIES.INIT,
        message: 'Успешно зарегистрирована история изменений',
      }));
  } else {
    await audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.INIT,
      message: 'История изменений не обновлена',
    });
  }
};
