const client = require('./client');

module.exports = {
  client,
  commandName: 'play',
  deferReply: jest.fn().mockResolvedValue(),
  guildId: '301783183828189184',
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
    getInteger: jest.fn(),
    getString: jest.fn(),
    getSubcommand: jest.fn(),
  },
  user: {
    id: '348774809003491329',
  },
};
