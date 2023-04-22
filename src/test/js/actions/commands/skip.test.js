const expectedSuccess = require('../../../resources/actions/commands/skip/expectedParams');
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
const {execute, skip} = require('../../../../main/js/actions/commands/skip');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Доступ к команде skip запрещен'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.skip');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('skip', interaction);
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.skip).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('no playing', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Плеер не играет или в очереди не достаточно композиций'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.skip');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isPlaying).toHaveBeenCalledWith('301783183828189184');
    expect(commandsMocked.notifyNoPlaying).toHaveBeenCalledWith('skip', interaction, true);
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.skip).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('unequal channels', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.skip');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(playerMocked.isSameChannel).toHaveBeenCalledWith('301783183828189184', '343847059612237824');
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('skip', interaction, true);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.skip).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.skip.mockReturnValueOnce({title: 'Пример наименования песни'});

    const result = await execute(interaction);

    expect(result).toEqual({});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.skip');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSuccess);
    expect(playerMocked.skip).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('skip', () => {
  test('is not execute', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isPlaying.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.skip.mockReturnValueOnce({title: 'Пример наименования песни'});

    const result = await skip(interaction, false);

    expect(result).toEqual({});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.skip');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.skip).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
