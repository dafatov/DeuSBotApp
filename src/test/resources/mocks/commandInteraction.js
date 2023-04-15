const client = require('./client');
const guild = require('./guild');
const member = require('./member');
const user = require('./user');

module.exports = {
  client,
  commandName: null,
  deferred: null,
  deferReply: jest.fn().mockResolvedValue(),
  editReply: jest.fn(),
  followUp: jest.fn(),
  guild,
  guildId: '301783183828189184',
  isRepliable: jest.fn(),
  member,
  options: {
    getChannel: jest.fn(),
    getInteger: jest.fn(),
    getString: jest.fn(),
    getSubcommand: jest.fn(),
  },
  replied: null,
  reply: jest.fn(),
  user,
};
