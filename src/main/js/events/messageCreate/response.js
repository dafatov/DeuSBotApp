const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {audit} = require('../../actions/auditor');
const {getAll} = require('../../db/repositories/responses');
const {stringify} = require('../../utils/string');
const {t} = require('i18next');

module.exports.execute = ({message}) => {
  if (message.author.bot) {
    return;
  }

  return getAll(message.guildId)
    .then(rules => Promise.all(rules.map(rule => {
      if (message.content.match(rule.regex)) {
        return message.reply(rule.react)
          .then(() => audit({
            guildId: message.guild.id,
            type: TYPES.INFO,
            category: CATEGORIES.RESPONSE,
            message: t('inner:audit.response', {message: message.content, regex: rule.regex, react: rule.react}),
          }));
      }
    }))).catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.RESPONSE,
      message: stringify(e),
    }));
};
