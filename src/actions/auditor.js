const {deleteBeforeWithOffset, add, getAll} = require("../repositories/audit");
const {stringify, padEnum} = require("../utils/string");
const {bigIntReplacer} = require("../utils/jsonMapping");

module.exports.TYPES = Object.freeze({
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DEBUG: 'debug'
});
module.exports.CATEGORIES = Object.freeze({
  PLAYER: 'player',
  UNCATEGORIZED: 'uncategorized',
  INIT: 'init',
  AUDITOR: 'auditor'
});

module.exports.init = async () => {
  (async function loop() {
    if (condition()) {
      const interval = '1M';

      await deleteBeforeWithOffset(interval).then(response => {
        if (response?.rowCount > 0) {
          module.exports.audit({
            guildId: null,
            type: module.exports.TYPES.INFO,
            category: module.exports.CATEGORIES.AUDITOR,
            message: `Успешно удалены аудиты (строк: ${response.rowCount}) за ранний интервал: ${interval}`
          })
        }
      });
    }
    setTimeout(loop, 90000 - (new Date() % 60000));
  }()).then(() => module.exports.audit({
    guildId: null,
    type: module.exports.TYPES.INFO,
    category: module.exports.CATEGORIES.INIT,
    message: 'Успешно зарегистрирован аудитор'
  }));
}

module.exports.audit = async ({guildId, type, category, message}) => {
  if (!Object.values(module.exports.TYPES).includes(type)) {
    type = module.exports.TYPES.ERROR;
  }
  if (!Object.values(module.exports.CATEGORIES).includes(category)) {
    category = module.exports.CATEGORIES.UNCATEGORIZED;
  }
  message = stringify(message);
  console.log(`[Log][${padEnum(type, module.exports.TYPES)}][${padEnum(category, module.exports.CATEGORIES)}][${guildId ?? '                  '}]: ${message}`);
  if (!process.env.DEV) {
    await add({guildId, type, category, message});
  }
}

module.exports.getGuilds = async (client) =>
  getAll().then(audit => audit.map(a => a.guildId))
    .then(guildIds => client.guilds.fetch()
      .then(guilds => guilds.filter(guild => guildIds.includes(guild.id))))
    .then(guilds => JSON.stringify(guilds, bigIntReplacer));

const condition = () => {
  const now = new Date();
  return now.getHours() === 0 && now.getMinutes() === 0;
}