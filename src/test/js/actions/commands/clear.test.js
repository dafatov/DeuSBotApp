const {cloneDeep} = require('lodash');
const expectedSuccess = require('../../../resources/actions/commands/clear/expectedParams');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const playerModuleName = '../../../../main/js/actions/player';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {clear, execute} = require('../../../../main/js/actions/commands/clear');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Доступ к команде clear запрещен'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.clear');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('clear', interaction);
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(playerMocked.clearQueue).not.toHaveBeenCalled();
  });

  test.each([
    {queue: {connection: null}},
    {queue: {connection: {}, player: null}},
    {queue: {connection: {}, player: {}, songs: null}},
    {queue: {connection: {}, player: {}, songs: []}},
  ])('no playing: $queue', async ({queue}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue(queue);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Плеер не играет'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.clear');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).toHaveBeenCalledWith('clear', interaction, true);
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(playerMocked.clearQueue).not.toHaveBeenCalled();
  });

  test.each([
    {emptyChannel: false},
    {emptyChannel: true},
  ])('unequal channels. empty channel: $emptyChannel', async ({emptyChannel}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({connection: {joinConfig: {channelId: ''}}, player: {}, songs: [{}]});
    const clonedInteraction = cloneDeep(interaction);
    clonedInteraction.member.voice = {...clonedInteraction.member.voice, channel: null};
    const usedInteraction = emptyChannel
      ? interaction
      : clonedInteraction;

    const result = await execute(usedInteraction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.clear');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('clear', usedInteraction, true);
    expect(playerMocked.clearQueue).not.toHaveBeenCalled();
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({
      connection: {
        joinConfig: {
          channelId: '343847059612237824',
        },
      }, player: {}, songs: [{}],
    });

    const result = await execute(interaction);

    expect(result).toEqual({});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.clear');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSuccess);
    expect(playerMocked.clearQueue).toHaveBeenCalledWith('301783183828189184');
    expect(auditMocked.audit).toHaveBeenCalled();
  });
});

describe('clear', () => {
  test('is not execute', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({
      connection: {
        joinConfig: {
          channelId: '343847059612237824',
        },
      }, player: {}, songs: [{}],
    });

    const result = await clear(interaction, false);

    expect(result).toEqual({});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.clear');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.clearQueue).toHaveBeenCalledWith('301783183828189184');
    expect(auditMocked.audit).toHaveBeenCalled();
  });
});
