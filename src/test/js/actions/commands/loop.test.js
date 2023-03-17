const expectedSuccessLooped = require('../../../resources/actions/commands/loop/expectedParamsLooped');
const expectedSuccessUnlooped = require('../../../resources/actions/commands/loop/expectedParamsUnlooped');
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
const {execute, loop} = require('../../../../main/js/actions/commands/loop');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Доступ к команде loop запрещен'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('loop', interaction);
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.loop).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('no playing', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Плеер не играет или в очереди не достаточно композиций'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isPlaying).toHaveBeenCalledWith('301783183828189184');
    expect(commandsMocked.notifyNoPlaying).toHaveBeenCalledWith('loop', interaction, true);
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.loop).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('unequal channels', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(playerMocked.isSameChannel).toHaveBeenCalledWith(interaction);
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('loop', interaction, true);
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.loop).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('is live', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isPlayingLive.mockReturnValueOnce(true);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Играет стрим'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(playerMocked.isPlayingLive).toHaveBeenCalledWith('301783183828189184');
    expect(commandsMocked.notifyIsLive).toHaveBeenCalledWith('loop', interaction, true);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.loop).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {isLoop: true, expected: expectedSuccessUnlooped},
    {isLoop: false, expected: expectedSuccessLooped}
  ])('success: $isLoop', async ({isLoop, expected}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isPlayingLive.mockReturnValueOnce(false);
    playerMocked.loop.mockReturnValueOnce(!isLoop);

    const result = await execute(interaction);

    expect(result).toEqual({'isLoop': !isLoop});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expected);
    expect(playerMocked.loop).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('loop', () => {
  test.each([
    {isLoop: true},
    {isLoop: false}
  ])('is not execute: $isLoop', async ({isLoop}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isPlayingLive.mockReturnValueOnce(false);
    playerMocked.loop.mockReturnValueOnce(!isLoop);

    const result = await loop(interaction, false);

    expect(result).toEqual({'isLoop': !isLoop});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.loop).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
