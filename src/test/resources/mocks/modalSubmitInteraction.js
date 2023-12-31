const client = require('./client');
const guild = require('./guild');
const user = require('./user');

module.exports = {
  client,
  customId: null,
  deferReply: jest.fn(),
  fields: {
    getTextInputValue: jest.fn(),
    fields: [],
  },
  guildId: guild.id,
  user,
};
