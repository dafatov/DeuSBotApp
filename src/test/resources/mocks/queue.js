const {Collection} = require('discord.js');
const {VoiceConnectionStatus} = require('@discordjs/voice');

module.exports = {
  connection: {
    _state: {
      status: VoiceConnectionStatus.Destroyed,
    },
    destroy: jest.fn(),
  },
  voiceChannel: {
    id: '668558230535929877',
    members: new Collection([
      [
        '1',
        {
          user: {
            bot: null,
          },
        },
      ],
      [
        '2',
        {
          user: {
            bot: null,
          },
        },
      ],
    ]),
  },
};
