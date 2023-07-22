const author = require('./user');
const guild = require('./guild');

module.exports = {
  author,
  content: null,
  guild,
  guildId: guild.id,
  reply: jest.fn(),
  webhookId: null,
};
