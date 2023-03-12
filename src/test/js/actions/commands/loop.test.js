const {cloneDeep} = require('lodash');
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
const auditMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
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
    expect(auditMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {queue: {nowPlaying: {}}},
    {queue: {nowPlaying: {song: {}}, connection: null}},
    {queue: {nowPlaying: {song: {}}, connection: {}, player: null}},
  ])('no playing: $queue', async ({queue}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue(queue);

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Плеер не играет'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).toHaveBeenCalledWith('loop', interaction, true);
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.loop).not.toHaveBeenCalled();
    expect(auditMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {emptyChannel: false},
    {emptyChannel: true},
  ])('unequal channels. empty channel: $emptyChannel', async ({emptyChannel}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({nowPlaying: {song: {}}, connection: {joinConfig: {channelId: ''}}, player: {}});
    const clonedInteraction = cloneDeep(interaction);
    clonedInteraction.member.voice = {...clonedInteraction.member.voice, channel: null};
    const usedInteraction = emptyChannel
      ? interaction
      : clonedInteraction;

    const result = await execute(usedInteraction);

    expect(result).toEqual({'result': 'Не совпадают каналы'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('loop', usedInteraction, true);
    expect(commandsMocked.notifyIsLive).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.loop).not.toHaveBeenCalled();
    expect(auditMocked.audit).not.toHaveBeenCalled();
  });

  test('is live', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({
      nowPlaying: {song: {isLive: true}}, connection: {
        joinConfig: {
          channelId:
            '343847059612237824',
        },
      }, player: {},
    });

    const result = await execute(interaction);

    expect(result).toEqual({'result': 'Играет стрим'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.loop');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyNoPlaying).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notifyIsLive).toHaveBeenCalledWith('loop', interaction, true);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(playerMocked.loop).not.toHaveBeenCalled();
    expect(auditMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {isLoop: true, expected: expectedSuccessUnlooped},
    {isLoop: false, expected: expectedSuccessLooped}
  ])('success: $isLoop', async ({isLoop, expected}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({
      nowPlaying: {song: {isLive: false, isLoop}}, connection: {
        joinConfig: {
          channelId:
            '343847059612237824',
        },
      }, player: {},
    });
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
    expect(auditMocked.audit).toHaveBeenCalled();
  });
});

describe('loop', () => {
  test.each([
    {isLoop: true},
    {isLoop: false}
  ])('is not execute: $isLoop', async ({isLoop}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValue({
      nowPlaying: {song: {isLive: false, isLoop}}, connection: {
        joinConfig: {
          channelId:
            '343847059612237824',
        },
      }, player: {},
    });
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
    expect(auditMocked.audit).toHaveBeenCalled();
  });
});
