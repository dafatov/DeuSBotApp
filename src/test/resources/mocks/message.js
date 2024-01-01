const author = require('./user');
const guild = require('./guild');
const interactionCollector = require('./interactionCollector');

module.exports = {
  author,
  content: null,
  edit: jest.fn(),
  guild,
  guildId: guild.id,
  reply: jest.fn(),
  webhookId: null,
  createMessageComponentCollector:  jest.fn(() => interactionCollector),
};
