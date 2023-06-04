const commandInteraction = require('../../../resources/mocks/commandInteraction');
const expectedModal = require('../../../resources/actions/commands/play/expectedModal');
const expectedParamsPlaylist = require('../../../resources/actions/commands/play/expectedParamsPlaylist');
const expectedParamsSearch = require('../../../resources/actions/commands/play/expectedParamsSearch');
const expectedParamsSong = require('../../../resources/actions/commands/play/expectedParamsSong');
const expectedPlaylist = require('../../../resources/actions/commands/play/expectedPlaylist');
const expectedSearch = require('../../../resources/actions/commands/play/expectedSearch');
const expectedSong = require('../../../resources/actions/commands/play/expectedSong');
const locale = require('../../configs/locale');
const modalSubmitInteraction = require('../../../resources/mocks/modalSubmitInteraction');
const playlist = require('../../../resources/actions/commands/play/playlist');
const search = require('../../../resources/actions/commands/play/search');
const song = require('../../../resources/actions/commands/play/song');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const playerModuleName = '../../../../main/js/actions/player';
const youtubeModuleName = '../../../../main/js/api/external/youtube';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);
const youtubeMocked = jest.mock(youtubeModuleName).requireMock(youtubeModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const play = require('../../../../main/js/actions/commands/play');

beforeAll(() => locale.init());

describe('isDeferReply', () => {
  test.each([
    {audio: undefined, expected: false},
    {audio: '', expected: false},
    {audio: 'test', expected: true}
  ])('success: $audio', ({audio, expected}) => {
    commandInteraction.options.getString.mockReturnValueOnce(audio);

    const result = play.isDeferReply(commandInteraction);

    expect(result).toEqual(expected);
  });
});

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    const result = await play.execute(commandInteraction);

    expect(result).toEqual({'result': 'Доступ к команде play запрещен'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('play', commandInteraction);
    expect(commandsMocked.notify).not.toHaveBeenCalledWith();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('unequal channels', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isConnected.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(false);

    const result = await play.execute(commandInteraction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isConnected).toHaveBeenCalledWith('301783183828189184');
    expect(playerMocked.isSameChannel).toHaveBeenCalledWith('301783183828189184', '343847059612237824');
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('play', commandInteraction, true);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('opening modal', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isConnected.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);

    const result = await play.execute(commandInteraction);

    expect(result).toBeUndefined();
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isConnected).toHaveBeenCalledWith('301783183828189184');
    expect(playerMocked.isSameChannel).toHaveBeenCalledWith('301783183828189184', '343847059612237824');
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(commandInteraction.showModal).toHaveBeenCalledWith(expectedModal);
    expect(playerMocked.addAll).not.toHaveBeenCalled();
    expect(playerMocked.playPlayer).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  describe('success', () => {
    test('playlist', async () => {
      commandInteraction.options.getString.mockReturnValueOnce('playlistUrl');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      playerMocked.getNowPlaying.mockResolvedValueOnce({});
      playerMocked.getSize.mockResolvedValueOnce(0);
      playerMocked.getDuration.mockResolvedValueOnce(0);
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      youtubeMocked.getPlaylist.mockResolvedValueOnce(playlist);

      const result = await play.execute(commandInteraction);

      expect(result).toEqual({added: expectedPlaylist.info});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(youtubeMocked.getPlaylist).toHaveBeenCalledWith(commandInteraction, 'playlistUrl');
      expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedPlaylist);
      expect(playerMocked.playPlayer).toHaveBeenCalledWith(commandInteraction);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsPlaylist);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });

    test('song', async () => {
      commandInteraction.options.getString.mockReturnValueOnce('songUrl');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      playerMocked.getNowPlaying.mockResolvedValueOnce({});
      playerMocked.getSize.mockResolvedValueOnce(0);
      playerMocked.getDuration.mockResolvedValueOnce(0);
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      youtubeMocked.getPlaylist.mockRejectedValueOnce();
      youtubeMocked.getSong.mockResolvedValueOnce(song);

      const result = await play.execute(commandInteraction);

      expect(result).toEqual({added: expectedSong.info});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(youtubeMocked.getPlaylist).toHaveBeenCalledWith(commandInteraction, 'songUrl');
      expect(youtubeMocked.getSong).toHaveBeenCalledWith(commandInteraction, 'songUrl');
      expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedSong);
      expect(playerMocked.playPlayer).toHaveBeenCalledWith(commandInteraction);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsSong);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });

    test('search', async () => {
      commandInteraction.options.getString.mockReturnValueOnce('search');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      playerMocked.getNowPlaying.mockResolvedValueOnce({});
      playerMocked.getSize.mockResolvedValueOnce(0);
      playerMocked.getDuration.mockResolvedValueOnce(0);
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      youtubeMocked.getPlaylist.mockRejectedValueOnce();
      youtubeMocked.getSong.mockRejectedValueOnce();
      youtubeMocked.getSearch.mockResolvedValue(search);

      const result = await play.execute(commandInteraction);

      expect(result).toEqual({added: expectedSearch.info});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(youtubeMocked.getPlaylist).toHaveBeenCalledWith(commandInteraction, 'search');
      expect(youtubeMocked.getSong).toHaveBeenCalledWith(commandInteraction, 'search');
      expect(youtubeMocked.getSearch).toHaveBeenCalledWith(commandInteraction, 'search');
      expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedSearch);
      expect(playerMocked.playPlayer).toHaveBeenCalledWith(commandInteraction);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsSearch);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });
});

describe('onModal', () => {
  test('success', async () => {
    jest.replaceProperty(modalSubmitInteraction.fields, 'fields', [
      {value: 'value1'}, {value: 'value2'}, {value: 'value3'}, {value: ''}, {value: undefined}
    ]);
    jest.spyOn(play, 'play')
      .mockResolvedValueOnce()
      .mockResolvedValueOnce()
      .mockResolvedValueOnce();

    await play.onModal(modalSubmitInteraction);

    expect(play.play).toHaveBeenCalledTimes(3);
    expect(play.play).toHaveBeenNthCalledWith(1, modalSubmitInteraction, true, 'value1');
    expect(play.play).toHaveBeenNthCalledWith(2, modalSubmitInteraction, true, 'value2');
    expect(play.play).toHaveBeenNthCalledWith(3, modalSubmitInteraction, true, 'value3');
  });
});

describe('play', () => {
  test('success: song', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getNowPlaying.mockResolvedValueOnce({});
    playerMocked.getSize.mockResolvedValueOnce(0);
    playerMocked.getDuration.mockResolvedValueOnce(0);
    playerMocked.isConnected.mockReturnValueOnce(false);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    youtubeMocked.getPlaylist.mockRejectedValueOnce();
    youtubeMocked.getSong.mockResolvedValueOnce(song);

    const result = await play.play(commandInteraction, false, 'songUrl');

    expect(result).toEqual({added: expectedSong.info});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(youtubeMocked.getPlaylist).toHaveBeenCalledWith(commandInteraction, 'songUrl');
    expect(youtubeMocked.getSong).toHaveBeenCalledWith(commandInteraction, 'songUrl');
    expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedSong);
    expect(playerMocked.playPlayer).toHaveBeenCalledWith(commandInteraction);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
