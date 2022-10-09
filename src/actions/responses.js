const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const db = require('../db/repositories/responses.js');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

module.exports.init = async client => {
  await db.count().then(responses => responses.rows ?? [])
    .then(responses => client.guilds.fetch()
      .then(guilds => guilds.map(guild => `${guild.name}(${responses.filter(response => response.guild_id === guild.id).length})`)))
    .then(guilds => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.INIT,
      message: t('inner:audit.init.response', {guilds}),
    }))
    .catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.RESPONSE,
      message: stringify(e),
    }));
};

module.exports.execute = async message => {
  try {
    db.getAll(message.guildId).then(rules => rules.forEach(async e => {
      if (!e.regex || !e.react) {
        throw t('inner:error.response', {regex: e.regex, react: e.react});
      }

      if (message.content.match(e.regex)) {
        message.reply(`${e.react}`);
        await audit({
          guildId: message.guild.id,
          type: TYPES.INFO,
          category: CATEGORIES.RESPONSE,
          message: t('inner:audit.response', {message: message.content, regex: e.regex, react: e.react}),
        });
      }
    })).catch(e => {
      throw e;
    });
  } catch (e) {
    await audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.RESPONSE,
      message: stringify(e),
    });
  }
};
