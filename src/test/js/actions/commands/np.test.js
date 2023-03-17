const expectedSuccessElse = require('../../../resources/actions/commands/np/expectedParamsElse');
const expectedSuccessLive = require('../../../resources/actions/commands/np/expectedParamsLive');
const expectedSuccessRadio = require('../../../resources/actions/commands/np/expectedParamsRadio');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');
const nowPlayingElse = require('../../../resources/actions/commands/np/nowPlayingElse');
const nowPlayingLive = require('../../../resources/actions/commands/np/nowPlayingLive');
const nowPlayingRadio = require('../../../resources/actions/commands/np/nowPlayingRadio');

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
const {execute} = require('../../../../main/js/actions/commands/np');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.np');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('np', interaction);
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(attachmentsMocked.createStatus).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('no playing', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(false);

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.np');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isPlaying).toHaveBeenCalledWith('301783183828189184');
    expect(commandsMocked.notifyNoPlaying).toHaveBeenCalledWith('np', interaction);
    expect(attachmentsMocked.createStatus).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {nowPlaying: nowPlayingLive, expected: expectedSuccessLive},
    {nowPlaying: nowPlayingRadio, expected: expectedSuccessRadio},
    {nowPlaying: nowPlayingElse, expected: expectedSuccessElse}
  ])('success: $type', async ({nowPlaying, expected}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.getQueue.mockReturnValue({nowPlaying});
    attachmentsMocked.createStatus.mockResolvedValueOnce([32, 43, 11, 55]);
    radiosMocked.getRadios.mockReturnValueOnce({
      get: jest.fn().mockReturnValueOnce({
        getInfo: jest.fn().mockResolvedValueOnce('\nИсточник: **artist**\nКомпозиция: **song**')
      })
    });

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.np');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(attachmentsMocked.createStatus).toHaveBeenCalledWith('301783183828189184');
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expected);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
