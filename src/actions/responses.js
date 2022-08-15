const {log, error, logGuild} = require('../utils/logger.js');
const db = require('../db/repositories/responses.js');

module.exports.init = async (client) => {
  await db.count().then(response => response.rows ?? [])
    .then(response => response.map(r =>
      `${client.guilds.cache.get(r.guild_id).name}: ${r.count}`).sort().join(', '))
    .then(response => log(`Успешно зарегистрировано реакций для гильдий: [${response}]`))
    .catch(e => error(e));
};

module.exports.execute = async (message) => {
  try {
    db.getAll(message.guildId).then((rules) => rules.forEach(e => {
      if (!e.regex || !e.react) {
        throw `One of response [regex: "${e.regex}", react: "${e.react}"] is not valid.\nCheck syntax!`;
      }

      if (message.content.match(e.regex)) {
        message.reply(`${e.react}`);
        logGuild(message.guild.id, `[responses]: "${message.content}" : "${e.regex}" : "${e.react}"`);
      }
    })).catch((e) => {
      throw e
    });
  } catch (e) {
    error(e);
  }
};
