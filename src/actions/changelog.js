const {getLast, add} = require("../repositories/changelog");
const changelogDoc = require("../configs/changelogDoc");
const config = require("../configs/config");
const {log, error} = require("../utils/logger");

module.exports.init = async () => {
  if (!changelogDoc.isPublic || ((await getLast())?.version ?? 0) >= config.version) {
    return;
  }
  if ((await getLast())?.description !== changelogDoc.text) {
    await add(config.version, changelogDoc.text)
    log('Успешно зарегистрирована история изменений');
  } else {
    error('История изменений не обновлена!!!');
  }
}