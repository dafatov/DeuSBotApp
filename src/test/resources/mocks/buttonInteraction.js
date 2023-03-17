const client = require('./client');
const user = require('./user');

module.exports = {
  client,
  customId: null,
  guildId: '301783183828189184',
  message: {
    interaction: {
      commandName: null,
    },
    removeAttachments: jest.fn().mockResolvedValue(),
  },
  update: jest.fn(),
  user,
};
