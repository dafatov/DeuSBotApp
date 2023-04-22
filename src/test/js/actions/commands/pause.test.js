const expectedSuccessPaused = require('../../../resources/actions/commands/pause/expectedParamsPaused');
const expectedSuccessUnpaused = require('../../../resources/actions/commands/pause/expectedParamsUnPaused');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const playerModuleName = '../../../../main/js/actions/player';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, pause} = require('../../../../main/js/actions/commands/pause');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Доступ к команде pause запрещен'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.pause');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('pause', interaction);
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.pause).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('no playing', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Плеер не играет или в очереди не достаточно композиций'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.pause');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isPlaying).toHaveBeenCalledWith('301783183828189184');
    expect(commandsMocked.notifyNoPlaying).toHaveBeenCalledWith('pause', interaction, true);
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.pause).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('unequal channels: $channel', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.pause');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(playerMocked.isSameChannel).toHaveBeenCalledWith('301783183828189184', '343847059612237824');
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('pause', interaction, true);
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.pause).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('is live', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isLive.mockReturnValueOnce(true);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Играет стрим'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.pause');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(playerMocked.isLive).toHaveBeenCalledWith('301783183828189184');
    expect(commandsMocked.notifyIsLive).toHaveBeenCalledWith('pause', interaction, true);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.pause).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {isPause: true, expected: expectedSuccessUnpaused},
    {isPause: false, expected: expectedSuccessPaused}
  ])('success: $isPause', async ({isPause, expected}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isLive.mockReturnValueOnce(false);
    playerMocked.pause.mockReturnValueOnce(!isPause);

    const result = await execute(interaction);

    expect(result).toEqual({'isPause': !isPause});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.pause');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expected);
    expect(playerMocked.pause).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('pause', () => {
  test.each([
    {isPause: true},
    {isPause: false}
  ])('success: $isPause', async ({isPause}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isLive.mockReturnValueOnce(false);
    playerMocked.pause.mockReturnValueOnce(!isPause);

    const result = await pause(interaction, false);

    expect(result).toEqual({'isPause': !isPause});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.pause');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.pause).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
