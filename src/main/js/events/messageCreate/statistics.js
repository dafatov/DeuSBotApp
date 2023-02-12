const {update} = require('../../db/repositories/statistics');

module.exports.execute = ({message}) => {
  if (message.webhookId) {
    return;
  }

  return update(message.author.id, message.guildId, {messageCount: 1});
};
