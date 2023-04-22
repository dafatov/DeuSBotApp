const expectedParamsPlaylist = require('../../../resources/actions/commands/play/expectedParamsPlaylist');
const expectedParamsSearch = require('../../../resources/actions/commands/play/expectedParamsSearch');
const expectedParamsSong = require('../../../resources/actions/commands/play/expectedParamsSong');
const expectedPlaylist = require('../../../resources/actions/commands/play/expectedPlaylist');
const expectedSearch = require('../../../resources/actions/commands/play/expectedSearch');
const expectedSong = require('../../../resources/actions/commands/play/expectedSong');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');
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
const {execute, play} = require('../../../../main/js/actions/commands/play');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Доступ к команде play запрещен'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('play', interaction);
    expect(commandsMocked.notify).not.toHaveBeenCalledWith();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('unequal channels', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isConnected.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isConnected).toHaveBeenCalledWith('301783183828189184');
    expect(playerMocked.isSameChannel).toHaveBeenCalledWith('301783183828189184', '343847059612237824');
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('play', interaction, true);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  describe('success', () => {
    test('playlist', async () => {
      interaction.options.getString.mockReturnValueOnce('playlistUrl');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      playerMocked.getNowPlaying.mockResolvedValueOnce({});
      playerMocked.getSize.mockResolvedValueOnce(0);
      playerMocked.getDuration.mockResolvedValueOnce(0);
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      youtubeMocked.getPlaylist.mockResolvedValueOnce(playlist);

      const result = await execute(interaction);

      expect(result).toEqual({added: expectedPlaylist.info});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(youtubeMocked.getPlaylist).toHaveBeenCalledWith(interaction, 'playlistUrl');
      expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedPlaylist);
      expect(playerMocked.playPlayer).toHaveBeenCalledWith(interaction);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsPlaylist);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });

    test('song', async () => {
      interaction.options.getString.mockReturnValueOnce('songUrl');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      playerMocked.getNowPlaying.mockResolvedValueOnce({});
      playerMocked.getSize.mockResolvedValueOnce(0);
      playerMocked.getDuration.mockResolvedValueOnce(0);
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      youtubeMocked.getPlaylist.mockRejectedValueOnce();
      youtubeMocked.getSong.mockResolvedValueOnce(song);

      const result = await execute(interaction);

      expect(result).toEqual({added: expectedSong.info});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(youtubeMocked.getPlaylist).toHaveBeenCalledWith(interaction, 'songUrl');
      expect(youtubeMocked.getSong).toHaveBeenCalledWith(interaction, 'songUrl');
      expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedSong);
      expect(playerMocked.playPlayer).toHaveBeenCalledWith(interaction);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsSong);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });

    test('search', async () => {
      interaction.options.getString.mockReturnValueOnce('search');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      playerMocked.getNowPlaying.mockResolvedValueOnce({});
      playerMocked.getSize.mockResolvedValueOnce(0);
      playerMocked.getDuration.mockResolvedValueOnce(0);
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      youtubeMocked.getPlaylist.mockRejectedValueOnce();
      youtubeMocked.getSong.mockRejectedValueOnce();
      youtubeMocked.getSearch.mockResolvedValue(search);

      const result = await execute(interaction);

      expect(result).toEqual({added: expectedSearch.info});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(youtubeMocked.getPlaylist).toHaveBeenCalledWith(interaction, 'search');
      expect(youtubeMocked.getSong).toHaveBeenCalledWith(interaction, 'search');
      expect(youtubeMocked.getSearch).toHaveBeenCalledWith(interaction, 'search');
      expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedSearch);
      expect(playerMocked.playPlayer).toHaveBeenCalledWith(interaction);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsSearch);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
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

    const result = await play(interaction, false, 'songUrl');

    expect(result).toEqual({added: expectedSong.info});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.play');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(youtubeMocked.getPlaylist).toHaveBeenCalledWith(interaction, 'songUrl');
    expect(youtubeMocked.getSong).toHaveBeenCalledWith(interaction, 'songUrl');
    expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedSong);
    expect(playerMocked.playPlayer).toHaveBeenCalledWith(interaction);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
