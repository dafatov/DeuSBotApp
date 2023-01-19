const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {audit} = require('../../actions/auditor');
const db = require('../../db/repositories/responses');
const {stringify} = require('../../utils/string');
const {t} = require('i18next');

module.exports.execute = async ({message}) => {
  if (message.author.bot) {
    return;
  }

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
