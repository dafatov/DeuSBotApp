const {getLast, add, APPLICATIONS} = require('../db/repositories/changelog');
const changelog = require('../configs/changelog');
const {isVersionUpdated} = require('../utils/string');
const {audit} = require('../actions/auditor');
const {TYPES, CATEGORIES} = require('../db/repositories/audit');
const {version} = require('../../package');

module.exports.init = async () => {
  await this.publish(version, APPLICATIONS.DEUS_BOT, changelog.isPublic, changelog.message);
};

module.exports.publish = async (version, application, isPublic, message) => {
  const lastChangelog = await getLast(application);

  if (!isPublic || !version || !application || !message || !isVersionUpdated(lastChangelog?.version ?? '0.0.0', version)) {
    return lastChangelog?.version;
  }

  message = JSON.stringify(message);
  if ((lastChangelog?.message ?? '') !== message) {
    await add(version, application, message)
      .then(() => audit({
        guildId: null,
        type: TYPES.INFO,
        category: CATEGORIES.INIT,
        message: `Успешно зарегистрирована история изменений у ${application}`,
      }));
  } else {
    await audit({
      guildId: null,
      type: TYPES.WARNING,
      category: CATEGORIES.INIT,
      message: `История изменений не обновлена у ${application}`,
    });
  }
  return version;
};
