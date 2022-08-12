const {getLast, add} = require('../repositories/changelog');
const changelog = require('../configs/changelog');
const {parseVersion} = require('../utils/string');
const {audit, TYPES, CATEGORIES} = require('../actions/auditor');

module.exports.APPLICATIONS = Object.freeze({
  DEUS_BOT: 'deus_bot',
  DEUS_BOT_APP: 'deus_bot_app',
});

module.exports.init = async () => {
  await this.publish(process.env.HEROKU_RELEASE_VERSION, this.APPLICATIONS.DEUS_BOT, changelog.isPublic, changelog.message);
};

module.exports.publish = async (version, application, isPublic, message) => {
  if (!isPublic || !version || !application || process.env.DEV) {
    return `v${(await getLast(application))?.version}`;
  }

  message = JSON.stringify(message);
  if (((await getLast(application))?.message ?? '') !== message) {
    await add(parseVersion(version), application, message)
      .then(() => audit({
        guildId: null,
        type: TYPES.INFO,
        category: CATEGORIES.INIT,
        message: `Успешно зарегистрирована история изменений у ${application}`,
      }));
    return version;
  } else {
    await audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.INIT,
      message: `История изменений не обновлена у ${application}`,
    });
    return `v${(await getLast(application))?.version}`;
  }
};
