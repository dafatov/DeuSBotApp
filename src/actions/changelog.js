const {APPLICATIONS, add, getLast} = require('../db/repositories/changelog');
const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('../actions/auditor');
const changelog = require('../configs/changelog');
const {isVersionUpdated} = require('../utils/string');
const {t} = require('i18next');
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
  if ((lastChangelog?.message ?? '') === message) {
    await audit({
      guildId: null,
      type: TYPES.WARNING,
      category: CATEGORIES.INIT,
      message: t('inner:audit.changelog.unchanged', {application: application}),
    });
  } else {
    await add(version, application, message)
      .then(() => audit({
        guildId: null,
        type: TYPES.INFO,
        category: CATEGORIES.INIT,
        message: t('inner:audit.changelog.registered', {application: application}),
      }));
  }
  return version;
};
