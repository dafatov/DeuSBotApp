const client = require('./client');
const guild = require('./guild');
const member = require('./member');
const user = require('./user');

module.exports = {
  client,
  customId: null,
  guild,
  guildId: '301783183828189184',
  member,
  message: {
    interaction: {
      commandName: null,
    },
    removeAttachments: jest.fn().mockResolvedValue(),
  },
  update: jest.fn(),
  user,
};
