const {getLast, add} = require("../repositories/changelog");
const changelogDoc = require("../configs/changelogDoc");
const config = require("../configs/config");
const {log} = require("../utils/logger");

module.exports.init = async () => {
  if (((await getLast())?.version ?? 0) >= config.version) {
    return;
  }
  if ((await getLast())?.description !== changelogDoc) {
    await add(config.version, changelogDoc)
    log('Успешно зарегистрирована история изменений');
  } else {
    throw 'История изменений не обновлена!!!'
  }
}