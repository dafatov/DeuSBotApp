const buttonInteraction = require('../../../resources/mocks/buttonInteraction');
const commandInteraction = require('../../../resources/mocks/commandInteraction');
const expectedNoPlaying = require('../../../resources/actions/commands/queue/expectedParamsNoPlaying');
const expectedOnSuccessNoPlaying = require('../../../resources/actions/commands/queue/expectedParamsOnSuccessNoPlaying');
const expectedOnSuccessRadio = require('../../../resources/actions/commands/queue/expectedParamsOnSuccessRadio');
const expectedSuccessEmpty = require('../../../resources/actions/commands/queue/expectedParamsSuccessEmpty');
const expectedSuccessEmptyLive = require('../../../resources/actions/commands/queue/expectedParamsSuccessEmptyLive');
const expectedSuccessRadio = require('../../../resources/actions/commands/queue/expectedParamsSuccessRadio');
const locale = require('../../configs/locale');
const queue = require('../../../resources/actions/commands/queue/queue');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const playerModuleName = '../../../../main/js/actions/player';
const radiosModuleName = '../../../../main/js/actions/radios';
const attachmentsModuleName = '../../../../main/js/utils/attachments';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);
const radiosMocked = jest.mock(radiosModuleName).requireMock(radiosModuleName);
const attachmentsMocked = jest.mock(attachmentsModuleName).requireMock(attachmentsModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, listener} = require('../../../../main/js/actions/commands/queue');

beforeAll(() => locale.init());

afterEach(() => jest.restoreAllMocks());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.queue');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('queue', commandInteraction);
    expect(attachmentsMocked.createStatus).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('no playing', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getSize.mockResolvedValueOnce(0);
    playerMocked.getAll.mockResolvedValueOnce([]);
    playerMocked.isPlaying.mockReturnValueOnce(false);

    await execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.queue');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(attachmentsMocked.createStatus).not.toHaveBeenCalled();
    expect(playerMocked.isPlaying).toHaveBeenCalledWith('301783183828189184');
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedNoPlaying);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test.each([
    {songs: queue.songs, songType: 'radio', songIsLive: true, expected: expectedSuccessRadio},
    {songs: [], songType: 'youtube', songIsLive: true, expected: expectedSuccessEmptyLive},
    {songs: [], songType: 'youtube', songIsLive: false, expected: expectedSuccessEmpty},
  ])(
    'success: {songs: $songs, songType: $songType, songIsLive: $songIsLive}',
    async ({songs, songType, songIsLive, expected}) => {
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      playerMocked.getSize.mockResolvedValueOnce(songs.length);
      playerMocked.isPlaying.mockReturnValueOnce(true);
      playerMocked.getNowPlaying.mockReturnValueOnce(queue.nowPlaying);
      playerMocked.getAll.mockResolvedValueOnce(songs);
      attachmentsMocked.createStatus.mockResolvedValueOnce([67, 43, 89, 13]);
      jest.replaceProperty(queue.nowPlaying.song, 'type', songType);
      jest.replaceProperty(queue.nowPlaying.song, 'isLive', songIsLive);
      radiosMocked.getRadios.mockReturnValueOnce({
        get: jest.fn().mockReturnValueOnce({
          getInfo: jest.fn().mockResolvedValueOnce('\nИсточник: **artist**\nКомпозиция: **song**'),
        }),
      });

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.queue');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(attachmentsMocked.createStatus).toHaveBeenCalledWith('301783183828189184', queue.nowPlaying);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expected);
      expect(auditorMocked.audit).toHaveBeenCalled();
    },
  );
});

describe('listener', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await listener(buttonInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.queue');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('queue', buttonInteraction);
    expect(attachmentsMocked.createStatus).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('no playing', async () => {
    playerMocked.getNowPlaying.mockReturnValue(queue.nowPlaying);
    playerMocked.getSize.mockResolvedValueOnce(queue.songs.length);
    playerMocked.getAll.mockResolvedValueOnce(queue.songs);
    jest.replaceProperty(buttonInteraction, 'customId', 'next');
    jest.replaceProperty(buttonInteraction, 'message', {
      ...buttonInteraction.message,
      ...expectedSuccessRadio[1],
    });
    jest.replaceProperty(queue, 'nowPlaying', {});
    attachmentsMocked.createStatus.mockResolvedValueOnce([67, 43, 89, 13]);
    radiosMocked.getRadios.mockReturnValueOnce({
      get: jest.fn().mockReturnValueOnce({
        getInfo: jest.fn().mockResolvedValueOnce('\nИсточник: **artist**\nКомпозиция: **song**'),
      }),
    });

    await listener(buttonInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.queue');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(buttonInteraction.update).toHaveBeenCalledWith(...expectedOnSuccessNoPlaying);
    expect(buttonInteraction.message.removeAttachments).toHaveBeenCalled();
    expect(attachmentsMocked.createStatus).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
  });

  test('success', async () => {
    playerMocked.getSize.mockResolvedValueOnce(queue.songs.length);
    playerMocked.getNowPlaying.mockReturnValueOnce(queue.nowPlaying);
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.getAll.mockResolvedValueOnce(queue.songs);
    jest.replaceProperty(buttonInteraction, 'customId', 'next');
    jest.replaceProperty(buttonInteraction, 'message', {
      ...buttonInteraction.message,
      ...expectedSuccessRadio[1],
    });
    jest.replaceProperty(queue, 'nowPlaying', queue.nowPlaying);
    attachmentsMocked.createStatus.mockResolvedValueOnce([67, 43, 89, 13]);
    radiosMocked.getRadios.mockReturnValueOnce({
      get: jest.fn().mockReturnValueOnce({
        getInfo: jest.fn().mockResolvedValueOnce('\nИсточник: **artist**\nКомпозиция: **song**'),
      }),
    });
    jest.replaceProperty(queue.nowPlaying.song, 'type', 'radio');

    await listener(buttonInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.queue');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(buttonInteraction.update).toHaveBeenCalledWith(...expectedOnSuccessRadio);
    expect(buttonInteraction.message.removeAttachments).toHaveBeenCalled();
    expect(attachmentsMocked.createStatus).toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
  });
});
