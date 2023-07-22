const {AudioPlayerStatus, VoiceConnectionStatus} = require('@discordjs/voice');
const {TYPES} = require('../../../main/js/db/repositories/queue');
const member = require('./member');

module.exports = {
  connection: {
    _state: {
      status: VoiceConnectionStatus.Ready,
    },
    destroy: jest.fn(),
    joinConfig: {
      channelId: member.voice.channelId,
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
