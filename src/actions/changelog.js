const {getLast, add} = require("../repositories/changelog");
const changelogDoc = require("../configs/changelogDoc");
const config = require("../configs/config");
const {log, error} = require("../utils/logger");
const {parseVersion} = require("../utils/string");

module.exports.init = async () => {
  if (!changelogDoc.isPublic || ((await getLast())?.version ?? 0) >= parseVersion(process.env.HEROKU_RELEASE_VERSION)) {
    return;
  }
  if ((await getLast())?.description !== changelogDoc.text) {
    await add(parseVersion(process.env.HEROKU_RELEASE_VERSION), changelogDoc.text)
    log('Успешно зарегистрирована история изменений');
  } else {
    error('История изменений не обновлена!!!');
  }
}