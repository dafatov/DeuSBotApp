const expectedSuccess = require('../../../resources/actions/commands/remove/expectedParams');
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
const {execute, remove} = require('../../../../main/js/actions/commands/remove');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Доступ к команде remove запрещен'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.remove');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
    expect(playerMocked.removeQueue).not.toHaveBeenCalled();
  });

  test('no playing', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isLessQueue.mockReturnValueOnce(true);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Плеер не играет или в очереди не достаточно композиций'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.remove');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isLessQueue).toHaveBeenCalledWith('301783183828189184', 1);
    expect(commandsMocked.notifyNoPlaying).toHaveBeenCalledWith('remove', interaction, true);
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
    expect(playerMocked.removeQueue).not.toHaveBeenCalled();
  });

  test('unequal channels', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isLessQueue.mockReturnValueOnce(false);
    playerMocked.isSameChannel.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.remove');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(playerMocked.isSameChannel).toHaveBeenCalledWith(interaction);
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('remove', interaction, true);
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
    expect(playerMocked.removeQueue).not.toHaveBeenCalled();
  });

  test('unbound: {targetIndex: $targetIndex}', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isLessQueue.mockReturnValueOnce(false);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isValidIndex.mockReturnValueOnce(false);
    interaction.options.getInteger.mockReturnValueOnce(0);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Выход за пределы очереди'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.remove');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(playerMocked.isValidIndex).toHaveBeenCalledWith('301783183828189184', -1);
    expect(commandsMocked.notifyUnbound).toHaveBeenCalledWith('remove', interaction, true);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
    expect(playerMocked.removeQueue).not.toHaveBeenCalled();
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({songs: [{title: 'title 1'}, {title: 'title 2'}, {title: 'title 3'}]});
    playerMocked.isLessQueue.mockReturnValueOnce(false);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isValidIndex.mockReturnValueOnce(true);
    interaction.options.getInteger.mockReturnValueOnce(2);
    playerMocked.removeQueue.mockReturnValueOnce({title: 'title 2'});

    const result = await execute(interaction);

    expect(result).toEqual({'isRemoved': {'title': 'title 2'}});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.remove');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSuccess);
    expect(playerMocked.removeQueue).toHaveBeenCalledWith('301783183828189184', 1);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('remove', () => {
  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({songs: [{title: 'title 1'}, {title: 'title 2'}, {title: 'title 3'}]});
    playerMocked.isLessQueue.mockReturnValueOnce(false);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isValidIndex.mockReturnValueOnce(true);
    playerMocked.removeQueue.mockReturnValueOnce({title: 'title 2'});

    const result = await remove(interaction, false, 1);

    expect(result).toEqual({'isRemoved': {'title': 'title 2'}});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.remove');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.removeQueue).toHaveBeenCalledWith('301783183828189184', 1);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
