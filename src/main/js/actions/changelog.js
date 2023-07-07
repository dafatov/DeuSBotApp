const {APPLICATIONS, add, getLast} = require('../db/repositories/changelog');
const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const changelog = require('../configs/changelog');
const isEqual = require('lodash/isEqual');
const {isVersionUpdated} = require('../utils/string');
const {t} = require('i18next');

module.exports.init = async () => {
  await this.publish(process.env.npm_package_version, APPLICATIONS.DEUS_BOT, process.env.npm_package_config_isPublic === 'true', changelog);
};

module.exports.publish = async (version, application, isPublic, message) => {
  const lastChangelog = await getLast(application);

  if (!isPublic || !version || !application || !message || !isVersionUpdated(lastChangelog?.version ?? '0.0.0', version)) {
    return lastChangelog?.version;
  }

  if (isEqual(lastChangelog?.message, message)) {
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
