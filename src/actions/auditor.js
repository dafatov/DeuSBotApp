const {removeBeforeWithOffset, add, getAll, TYPES, CATEGORIES} = require('../db/repositories/audit');
const {stringify, padEnum} = require('../utils/string');
const {bigIntReplacer} = require('../utils/jsonMapping');

module.exports.init = async () => {
  (async function loop() {
    if (condition()) {
      const interval = '1M';

      await removeBeforeWithOffset(interval).then(response => {
        if (response?.rowCount > 0) {
          module.exports.audit({
            guildId: null,
            type: TYPES.INFO,
            category: CATEGORIES.AUDITOR,
            message: `Успешно удалены аудиты (строк: ${response.rowCount}) за ранний интервал: ${interval}`,
          });
        }
      });
    }
    setTimeout(loop, 90000 - (new Date() % 60000));
  }()).then(() => module.exports.audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: 'Успешно зарегистрирован аудитор',
  }));
}

module.exports.audit = async ({guildId, type, category, message}) => {
  if (!Object.values(TYPES).includes(type)) {
    type = TYPES.ERROR;
  }
  if (!Object.values(CATEGORIES).includes(category)) {
    category = CATEGORIES.UNCATEGORIZED;
  }
  message = stringify(message);
  await add({guildId, type, category, message});
  if (process.env.LOGGING === 'DEBUG' || type !== TYPES.DEBUG) {
    console.log(`[Log][${padEnum(type, TYPES)}][${padEnum(category, CATEGORIES)}][${guildId ?? '                  '}]: ${message}`);
  }
}

module.exports.getGuilds = async (client) =>
  getAll().then(audit => audit.map(a => a.guild_id))
    .then(guildIds => client.guilds.fetch()
      .then(guilds => guilds.filter(guild => guildIds.includes(guild.id))))
    .then(guilds => JSON.stringify(guilds, bigIntReplacer));

const condition = () => {
  const now = new Date();
  return now.getHours() === 0 && now.getMinutes() === 0;
}
