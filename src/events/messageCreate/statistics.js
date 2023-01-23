const {update} = require('../../db/repositories/statistics');

module.exports.execute = ({message}) =>
  update(message.author.id, message.guildId, {messageCount: 1});
