const expectedSuccess = require('../../../resources/actions/commands/move/expectedParams');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const playerModuleName = '../../../../main/js/actions/player';
const arrayModuleName = '../../../../main/js/utils/array';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);
const arrayMocked = jest.mock(arrayModuleName).requireMock(arrayModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, move} = require('../../../../main/js/actions/commands/move');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Доступ к команде move запрещен'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.move');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
    expect(arrayMocked.arrayMove).not.toHaveBeenCalled();
  });

  test('no playing', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isLessQueue.mockReturnValueOnce(true);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Плеер не играет или в очереди не достаточно композиций'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.move');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.isLessQueue).toHaveBeenCalledWith('301783183828189184', 2);
    expect(commandsMocked.notifyNoPlaying).toHaveBeenCalledWith('move', interaction, true);
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
    expect(arrayMocked.arrayMove).not.toHaveBeenCalled();
  });

  test('unequal channels', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isLessQueue.mockReturnValueOnce(false);
    playerMocked.isSameChannel.mockReturnValueOnce(false);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.move');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(playerMocked.isSameChannel).toHaveBeenCalledWith(interaction);
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('move', interaction, true);
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
    expect(arrayMocked.arrayMove).not.toHaveBeenCalled();
  });

  test(
    'unbound', async () => {
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      playerMocked.isLessQueue.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      playerMocked.isValidIndex.mockReturnValueOnce(true).mockReturnValueOnce(false);
      interaction.options.getInteger.mockReturnValueOnce(0).mockReturnValueOnce(1);

      const result = await execute(interaction);

      expect(result).toEqual({'result': 'Выход за пределы очереди'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.move');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(playerMocked.isValidIndex).toHaveBeenNthCalledWith(1, '301783183828189184', 0);
      expect(playerMocked.isValidIndex).toHaveBeenNthCalledWith(2, '301783183828189184', -1);
      expect(commandsMocked.notifyUnbound).toHaveBeenCalledWith('move', interaction, true);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(arrayMocked.arrayMove).not.toHaveBeenCalled();
    },
  );

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isLessQueue.mockReturnValueOnce(false);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isValidIndex.mockReturnValueOnce(true).mockReturnValueOnce(true);
    interaction.options.getInteger.mockReturnValueOnce(3).mockReturnValueOnce(1);
    playerMocked.moveQueue.mockReturnValueOnce({'title': 'title 1'});

    const result = await execute(interaction);

    expect(result).toEqual({'isMoved': {'title': 'title 1'}, 'newIndex': 2});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.move');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSuccess);
    expect(playerMocked.moveQueue).toHaveBeenCalledWith('301783183828189184', 0, 2);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('move', () => {
  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.isLessQueue.mockReturnValueOnce(false);
    playerMocked.isSameChannel.mockReturnValueOnce(true);
    playerMocked.isValidIndex.mockReturnValueOnce(true).mockReturnValueOnce(true);
    playerMocked.moveQueue.mockReturnValueOnce({'title': 'title 1'});

    const result = await move(interaction, false, 2, 0);

    expect(result).toEqual({'isMoved': {'title': 'title 1'}, 'newIndex': 2});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.move');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnbound).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.moveQueue).toHaveBeenCalledWith('301783183828189184', 0, 2);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
