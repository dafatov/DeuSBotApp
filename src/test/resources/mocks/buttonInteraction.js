const client = require('./client');
const guild = require('./guild');
const member = require('./member');
const user = require('./user');

module.exports = {
  client,
  customId: null,
  guild,
  guildId: guild.id,
  member,
  message: {
    interaction: {
      commandName: null,
    },
    removeAttachments: jest.fn(),
  },
  update: jest.fn(),
  user,
};
