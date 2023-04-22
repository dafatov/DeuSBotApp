const {AudioPlayerStatus, NoSubscriberBehavior, VoiceConnectionStatus} = require('@discordjs/voice');
const {TYPES} = require('../../../main/js/db/repositories/queue');
const client = require('../../resources/mocks/client');
const cloneDeep = require('lodash/cloneDeep');
const interaction = require('../../resources/mocks/commandInteraction');
let jukebox = require('../../resources/mocks/jukebox');
const locale = require('../configs/locale');

const auditorModuleName = '../../../main/js/actions/auditor';
const queueDbModuleName = '../../../main/js/db/repositories/queue';
const youtubeApiModuleName = '../../../main/js/api/external/youtube';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const queueDbMocked = jest.mock(queueDbModuleName).requireMock(queueDbModuleName);
const youtubeApiMocked = jest.mock(youtubeApiModuleName).requireMock(youtubeApiModuleName);
const discordVoiceMocked = jest.mock('@discordjs/voice').requireMock('@discordjs/voice');

// eslint-disable-next-line sort-imports-requires/sort-requires
const player = require('../../../main/js/actions/player');

beforeAll(() => locale.init());

beforeEach(() => {
  jukebox = cloneDeep(require('../../resources/mocks/jukebox'));
  player.setJukebox('301783183828189184', cloneDeep(jukebox));
});

describe('init', () => {
  test('success', async () => {
    jest.spyOn(player, 'clearQueue')
      .mockResolvedValueOnce()
      .mockResolvedValueOnce();

    await player.init(client);

    expect(player.clearQueue).toHaveBeenCalledTimes(2);
    expect(player.clearQueue).toHaveBeenNthCalledWith(1, '301783183828189184');
    expect(player.clearQueue).toHaveBeenNthCalledWith(2, '905052154027475004');
    expect(auditorMocked.audit).toHaveBeenCalled();
    expect(player.getJukebox('301783183828189184')).toEqual({connection: null, nowPlaying: {}, player: null});
  });
});

describe('getNowPlaying', () => {
  test('success', async () => {
    const result = await player.getNowPlaying('301783183828189184');

    expect(result).toEqual(jukebox.nowPlaying);
  });
});

describe('getSize', () => {
  test('success', async () => {
    queueDbMocked.getCount.mockResolvedValueOnce(3);

    const result = await player.getSize('301783183828189184');

    expect(result).toEqual(3);
    expect(queueDbMocked.getCount).toHaveBeenCalledWith('301783183828189184');
  });
});

describe('getDuration', () => {
  test('success', async () => {
    queueDbMocked.getDuration.mockResolvedValueOnce(3);

    const result = await player.getDuration('301783183828189184');

    expect(result).toEqual(3);
    expect(queueDbMocked.getDuration).toHaveBeenCalledWith('301783183828189184');
  });
});

describe('addAll', () => {
  test('success', async () => {
    await player.addAll('301783183828189184', {songs: [{}]});

    expect(queueDbMocked.addAll).toHaveBeenCalledWith('301783183828189184', [{}]);
  });
});

describe('getAll', () => {
  test('success', async () => {
    queueDbMocked.getAll.mockResolvedValueOnce([{}]);

    const result = await player.getAll('301783183828189184');

    expect(result).toEqual([{}]);
    expect(queueDbMocked.getAll).toHaveBeenCalledWith('301783183828189184');
  });
});

describe('remove', () => {
  test('success', async () => {
    queueDbMocked.remove.mockResolvedValueOnce({});

    const result = await player.remove('301783183828189184', 3);

    expect(result).toEqual({});
    expect(queueDbMocked.remove).toHaveBeenCalledWith('301783183828189184', 3);
  });
});

describe('move', () => {
  test('success', async () => {
    queueDbMocked.move.mockResolvedValueOnce({});

    const result = await player.move('301783183828189184', 3, 5);

    expect(result).toEqual({});
    expect(queueDbMocked.move).toHaveBeenCalledWith('301783183828189184', 3, 5);
  });
});

describe('skip', () => {
  test('success', async () => {
    const expected = jukebox.nowPlaying.song;
    queueDbMocked.getAll.mockResolvedValueOnce([{title: 'song_2'}]);

    const result = await player.skip('301783183828189184');

    expect(result).toEqual(expected);
    expect(player.getJukebox('301783183828189184')).toEqual({
      ...jukebox,
      nowPlaying: {
        ...jukebox.nowPlaying,
        song: {title: 'song_2'},
      },
    });
    expect(player.getJukebox('301783183828189184').player.stop).toHaveBeenCalledWith();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('loop', () => {
  test('success', async () => {
    const result = await player.loop('301783183828189184');

    expect(result).toEqual(true);
    expect(player.getJukebox('301783183828189184')).toEqual({
      ...jukebox,
      nowPlaying: {
        ...jukebox.nowPlaying,
        isLoop: true,
      },
    });
  });
});

describe('pause', () => {
  test('success: true', async () => {
    jest.replaceProperty(player.getJukebox('301783183828189184').nowPlaying, 'isPause', true);

    const result = await player.pause('301783183828189184');

    expect(result).toEqual(false);
    expect(player.getJukebox('301783183828189184')).toEqual({
      ...jukebox,
      nowPlaying: {
        ...jukebox.nowPlaying,
        isPause: false,
      },
    });
    expect(player.getJukebox('301783183828189184').player.pause).not.toHaveBeenCalled();
    expect(player.getJukebox('301783183828189184').player.unpause).toHaveBeenCalledWith();
  });

  test('success: false', async () => {
    jest.replaceProperty(player.getJukebox('301783183828189184').nowPlaying, 'isPause', false);

    const result = await player.pause('301783183828189184');

    expect(result).toEqual(true);
    expect(player.getJukebox('301783183828189184')).toEqual({
      ...jukebox,
      nowPlaying: {
        ...jukebox.nowPlaying,
        isPause: true,
      },
    });
    expect(player.getJukebox('301783183828189184').player.pause).toHaveBeenCalledWith();
    expect(player.getJukebox('301783183828189184').player.unpause).not.toHaveBeenCalled();
  });
});

describe('shuffle', () => {
  test('success', async () => {
    await player.shuffle('301783183828189184');

    expect(queueDbMocked.shuffle).toHaveBeenCalledWith('301783183828189184');
  });
});

describe('clearQueue', () => {
  test('success', async () => {
    await player.clearQueue('301783183828189184');

    expect(queueDbMocked.removeAll).toHaveBeenCalledWith('301783183828189184');
  });
});

describe('hasLive', () => {
  test.each([
    {isLive: true, queue: [], expected: true},
    {isLive: true, queue: [{isLive: true}], expected: true},
    {isLive: undefined, queue: [{isLive: true}], expected: true},
    {isLive: false, queue: [], expected: false},
    {isLive: false, queue: [{isLive: false}], expected: false},
  ])('success: {$isLive, $queue}', async ({isLive, queue, expected}) => {
    !isLive && queueDbMocked.getAll.mockResolvedValueOnce(queue);
    jest.replaceProperty(player.getJukebox('301783183828189184').nowPlaying.song, 'isLive', isLive);

    const result = await player.hasLive('301783183828189184');

    expect(result).toEqual(expected);
  });
});

describe('isEmpty', () => {
  test('success', async () => {
    jest.spyOn(player, 'isLessQueue').mockResolvedValueOnce(true);

    const result = await player.isEmpty('301783183828189184');

    expect(result).toEqual(true);
    expect(player.isLessQueue).toHaveBeenCalledWith('301783183828189184', 0);
  });
});

describe('isPlaying', () => {
  test.each([
    {song: jukebox?.nowPlaying.song, expected: true},
    {song: null, expected: false},
  ])('success: $song', async ({song, expected}) => {
    jest.replaceProperty(player.getJukebox('301783183828189184').nowPlaying, 'song', song);

    const result = await player.isPlaying('301783183828189184');

    expect(result).toEqual(expected);
  });
});

describe('isLive', () => {
  test.each([
    {song: jukebox?.nowPlaying.song, expected: true},
    {song: {...jukebox?.nowPlaying.song, isLive: false}, expected: false},
  ])('success: $song', async ({song, expected}) => {
    jest.replaceProperty(player.getJukebox('301783183828189184').nowPlaying, 'song', song);

    const result = await player.isLive('301783183828189184');

    expect(result).toEqual(expected);
  });
});

describe('isSameChannel', () => {
  test.each([
    {channelId: '343847059612237824', argChannelId: '343847059612237824', expected: true},
    {channelId: '-343847059612237824', argChannelId: '343847059612237824', expected: false},
    {channelId: null, argChannelId: '343847059612237824', expected: false},
    {channelId: null, argChannelId: null, expected: false},
  ])('success: {$channelId, $argChannelId}', async ({channelId, argChannelId, expected}) => {
    jest.replaceProperty(player.getJukebox('301783183828189184').connection.joinConfig, 'channelId', channelId);

    const result = await player.isSameChannel('301783183828189184', argChannelId);

    expect(result).toEqual(expected);
  });
});

describe('isValidIndex', () => {
  test.each([
    {index: 1, expected: true},
    {index: 're', expected: false},
    {index: 2, expected: false},
    {index: -1, expected: false},
  ])('success: $index', async ({index, expected}) => {
    !isNaN(index) && index >= 0 && jest.spyOn(player, 'getSize').mockResolvedValueOnce(2);

    const result = await player.isValidIndex('301783183828189184', index);

    expect(result).toEqual(expected);
  });
});

describe('isConnected', () => {
  test.each([
    {connection: jukebox.connection, expected: true},
    {connection: {...jukebox.connection, _state: {status: VoiceConnectionStatus.Destroyed}}, expected: false},
    {connection: null, expected: false},
  ])('success: $connection', async ({connection, expected}) => {
    jest.replaceProperty(player.getJukebox('301783183828189184'), 'connection', connection);

    const result = await player.isConnected('301783183828189184');

    expect(result).toEqual(expected);
  });
});

describe('isLessQueue', () => {
  test.each([
    {count: 1, expected: false},
    {count: 2, expected: false},
    {count: 3, expected: true},
  ])('success: $count', async ({count, expected}) => {
    jest.spyOn(player, 'getSize').mockResolvedValueOnce(2);

    const result = await player.isLessQueue('301783183828189184', count);

    expect(result).toEqual(expected);
  });
});

describe('playPlayer', () => {
  test('already playing', async () => {
    jest.spyOn(player, 'createConnection').mockReturnValueOnce();
    jest.spyOn(player, 'play');

    await player.playPlayer(interaction);

    expect(player.createConnection).toHaveBeenCalledWith(interaction);
    expect(player.play).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
    expect(player.getJukebox('301783183828189184')).toEqual(jukebox);
  });

  test('success', async () => {
    jest.spyOn(player, 'createConnection').mockReturnValueOnce();
    jest.replaceProperty(player.getJukebox('301783183828189184').player.state, 'status', AudioPlayerStatus.Idle);
    jest.spyOn(player, 'remove').mockResolvedValueOnce({title: 'song_3'});
    jest.spyOn(player, 'play').mockResolvedValueOnce();

    await player.playPlayer(interaction);

    expect(player.createConnection).toHaveBeenCalledWith(interaction);
    expect(player.play).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
    expect(player.getJukebox('301783183828189184')).toEqual({
      ...jukebox,
      nowPlaying: {
        ...jukebox.nowPlaying,
        song: {title: 'song_3'},
      },
      player: {
        ...jukebox.player,
        state: {
          ...jukebox.player.state,
          status: AudioPlayerStatus.Idle,
        },
      },
    });
  });
});

describe('destroyConnection', () => {
  test('success', async () => {
    jest.spyOn(player, 'clearQueue').mockResolvedValueOnce();
    const destroy = player.getJukebox('301783183828189184').connection.destroy;

    await player.destroyConnection('301783183828189184');

    expect(destroy).toHaveBeenCalledWith();
    expect(player.clearQueue).toHaveBeenCalledWith('301783183828189184');
    expect(player.getJukebox('301783183828189184')).toEqual({
      ...jukebox,
      connection: null,
      nowPlaying: {},
    });
  });
});

describe('createConnection', () => {
  test.each([
    {connection: jukebox.connection},
    {connection: {...jukebox.connection, _state: {status: VoiceConnectionStatus.Ready}}},
  ])('has connection: $connection', async ({connection}) => {
    const subscribe = player.getJukebox('301783183828189184').connection.subscribe;
    jest.replaceProperty(player.getJukebox('301783183828189184'), 'connection', connection);

    await player.createConnection({
      guildId: '301783183828189184',
      member: {voice: {channel: {id: '343847059612237824', guildId: '301783183828189184', guild: {voiceAdapterCreator: {}}}}},
    });

    expect(player.getJukebox('301783183828189184')).toEqual({...jukebox, connection});
    expect(subscribe).not.toHaveBeenCalled();
    expect(discordVoiceMocked.joinVoiceChannel).not.toHaveBeenCalled();
  });

  test('success', async () => {
    const connectionMocked = {subscribe: jest.fn()};
    jest.replaceProperty(player.getJukebox('301783183828189184'), 'connection', null);
    discordVoiceMocked.joinVoiceChannel.mockReturnValueOnce(connectionMocked);
    jest.spyOn(player, 'getPlayer').mockReturnValueOnce({});

    await player.createConnection({
      guildId: '301783183828189184',
      member: {voice: {channel: {id: '343847059612237824', guildId: '301783183828189184', guild: {voiceAdapterCreator: {}}}}},
    });

    expect(player.getJukebox('301783183828189184')).toEqual({...jukebox, connection: connectionMocked});
    expect(discordVoiceMocked.joinVoiceChannel).toHaveBeenCalledWith({
      adapterCreator: {}, channelId: '343847059612237824', guildId: '301783183828189184',
    });
    expect(connectionMocked.subscribe).toHaveBeenCalledWith({});
    expect(player.getPlayer).toHaveBeenCalledWith('301783183828189184');
  });
});

describe('getPlayer', () => {
  test('has player', () => {
    const result = player.getPlayer('301783183828189184');

    expect(result).toEqual(jukebox.player);
    expect(player.getJukebox('301783183828189184')).toEqual(jukebox);
    expect(discordVoiceMocked.createAudioPlayer).not.toHaveBeenCalled();
    expect(player.getJukebox('301783183828189184').player.on).not.toHaveBeenCalled();
  });

  test('create player', () => {
    const playerMocked = {on: jest.fn()};
    jest.replaceProperty(player.getJukebox('301783183828189184'), 'player', null);
    discordVoiceMocked.createAudioPlayer.mockReturnValueOnce(playerMocked);

    const result = player.getPlayer('301783183828189184');

    expect(result).toEqual(playerMocked);
    expect(player.getJukebox('301783183828189184')).toEqual({...jukebox, player: playerMocked});
    expect(discordVoiceMocked.createAudioPlayer).toHaveBeenCalledWith({
      behaviors: {noSubscriber: NoSubscriberBehavior.Stop},
    });
    expect(player.getJukebox('301783183828189184').player.on)
      .toHaveBeenNthCalledWith(1, 'error', expect.any(Function));
    expect(player.getJukebox('301783183828189184').player.on)
      .toHaveBeenNthCalledWith(2, AudioPlayerStatus.Idle, expect.any(Function));
  });
});

describe('play', () => {
  test.each([
    {type: TYPES.YOUTUBE},
    {type: TYPES.RADIO},
  ])('success: $type', async ({type}) => {
    const expectedResource = {
      resourceFrom: type === TYPES.YOUTUBE
        ? 'streamUrl'
        : 'smth url',
    };
    jest.replaceProperty(player.getJukebox('301783183828189184').nowPlaying.song, 'type', type);
    discordVoiceMocked.createAudioResource.mockImplementationOnce(arg => ({resourceFrom: arg}));
    type === TYPES.YOUTUBE && youtubeApiMocked.getStream.mockReturnValueOnce('streamUrl');

    await player.play('301783183828189184');

    expect(player.getJukebox('301783183828189184')).toEqual({
      ...jukebox,
      nowPlaying: {
        ...jukebox.nowPlaying,
        resource: expectedResource,
        song: {
          ...jukebox.nowPlaying.song,
          type,
        },
      },
    });
    expect(player.getJukebox('301783183828189184').player.play).toHaveBeenCalledWith(expectedResource);
  });
});

describe('onPlayerError', () => {
  test('success', () => {
    const result = player.onPlayerError('301783183828189184', 0);

    expect(result).toEqual(expect.any(Function));
  });

  describe('on', () => {
    test.each([
      {playbackDuration: 0, restarts: 10},
      {playbackDuration: 100, restarts: 10},
      {playbackDuration: 100, restarts: 0},
    ])('at the middle of playing: {$playbackDuration, $restarts}', async ({playbackDuration, restarts}) => {
      jest.spyOn(global, 'setTimeout');

      await player.onPlayerError('301783183828189184', restarts)({resource: {playbackDuration}});

      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(setTimeout).not.toHaveBeenCalled();
    });

    test('at the start of playing', async () => {
      jest.useFakeTimers({doNotFake: []});
      jest.spyOn(global, 'setTimeout');
      jest.spyOn(player, 'play').mockReturnValueOnce();

      await player.onPlayerError('301783183828189184', 0)({resource: {playbackDuration: 0}});
      jest.runAllTimers();

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 250);
      expect(player.play).toHaveBeenCalledWith('301783183828189184');
      expect(auditorMocked.audit).toHaveBeenCalledTimes(2);
    });
  });
});

describe('onPlayerIdle', () => {
  test('success', () => {
    const result = player.onPlayerIdle('301783183828189184');

    expect(result).toEqual(expect.any(Function));
  });

  describe('on', () => {
    test('isLoop', async () => {
      jest.replaceProperty(player.getJukebox('301783183828189184').nowPlaying, 'isLoop', true);
      jest.spyOn(player, 'isLessQueue');
      jest.spyOn(player, 'play').mockReturnValueOnce();

      await player.onPlayerIdle('301783183828189184')({playbackDuration: 3000});

      expect(player.play).toHaveBeenCalledWith('301783183828189184');
      expect(player.isLessQueue).not.toHaveBeenCalled();
      expect(player.getJukebox('301783183828189184')).toEqual({
        ...jukebox, nowPlaying: {
          ...jukebox.nowPlaying, isLoop: true,
        },
      });
      expect(auditorMocked.audit).toHaveBeenCalledTimes(1);
    });

    test('empty queue', async () => {
      jest.spyOn(player, 'isLessQueue').mockResolvedValueOnce(true);
      jest.spyOn(player, 'play').mockReturnValueOnce();

      await player.onPlayerIdle('301783183828189184')({playbackDuration: 3000});

      expect(player.play).not.toHaveBeenCalled();
      expect(player.isLessQueue).toHaveBeenCalledWith('301783183828189184', 1);
      expect(player.getJukebox('301783183828189184')).toEqual({
        ...jukebox, nowPlaying: {},
      });
      expect(auditorMocked.audit).toHaveBeenCalledTimes(2);
    });

    test('new song', async () => {
      jest.spyOn(player, 'isLessQueue').mockResolvedValueOnce(false);
      jest.spyOn(player, 'play').mockReturnValueOnce();
      queueDbMocked.remove.mockResolvedValueOnce({title: 'song_new'});

      await player.onPlayerIdle('301783183828189184')({playbackDuration: 3000});

      expect(player.play).toHaveBeenCalledWith('301783183828189184');
      expect(player.isLessQueue).toHaveBeenCalledWith('301783183828189184', 1);
      expect(player.getJukebox('301783183828189184')).toEqual({
        ...jukebox, nowPlaying: {
          ...jukebox.nowPlaying, song: {title: 'song_new'},
        },
      });
      expect(auditorMocked.audit).toHaveBeenCalledTimes(2);
    });
  });
});
