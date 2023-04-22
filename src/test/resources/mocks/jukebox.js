const {AudioPlayerStatus, VoiceConnectionStatus} = require('@discordjs/voice');
const {TYPES} = require('../../../main/js/db/repositories/queue');

module.exports = {
  connection: {
    _state: {
      status: VoiceConnectionStatus.Ready,
    },
    destroy: jest.fn(),
    joinConfig: {
      channelId: '343847059612237824',
    },
    subscribe: jest.fn(),
  },
  nowPlaying: {
    isLoop: false,
    isPause: false,
    song: {
      isLive: true,
      title: 'song_1',
      type: TYPES.YOUTUBE,
      url: 'smth url',
    },
  },
  player: {
    on: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    state: {
      status: AudioPlayerStatus.Playing,
    },
    stop: jest.fn(),
    unpause: jest.fn(),
  },
};
