const client = require('./client');
const guild = require('./guild');
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
  member: {
    voice: {
      channel: {
        id: '343847059612237824',
        guildId: '301783183828189184',
        guild: {
          voiceAdapterCreator: {},
        },
        name: 'Осенний кринж',
      },
    },
  },
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
