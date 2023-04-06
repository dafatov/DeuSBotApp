const {VoiceConnectionStatus} = require('@discordjs/voice');
const client = require('../../../resources/mocks/client');
const locale = require('../../configs/locale');
const queue = require('../../../resources/mocks/queue');

const auditorModuleName = '../../../../main/js/actions/auditor';
const playerModuleName = '../../../../main/js/actions/player';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/events/voiceStateUpdate/leave');

beforeAll(() => locale.init());

describe('execute', () => {
  test.each([
    {connection: null},
    {connection: queue.connection},
  ])('no connection: $connection', async ({connection}) => {
    jest.replaceProperty(queue, 'connection', connection);
    playerMocked.getQueue.mockReturnValueOnce(queue);

    await execute({client, newState: {guild: {id: '301783183828189184'}}});

    expect(playerMocked.clearNowPlaying).not.toHaveBeenCalled();
    expect(playerMocked.clearQueue).not.toHaveBeenCalled();
    expect(playerMocked.clearConnection).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {id: '909473788779958363', channelId: '668558230535929877'},
    {id: '-09473788779958363', channelId: '668558230535929877'},
    {id: '-09473788779958363', channelId: null},
    {id: null, channelId: '-68558230535929877'},
    {id: '-09473788779958363', channelId: '-68558230535929877'},
  ])('no leave: {$id, $channelId}', async ({id, channelId}) => {
    jest.replaceProperty(queue.connection._state, 'status', VoiceConnectionStatus.Ready);
    playerMocked.getQueue.mockReturnValueOnce(queue);

    await execute({
      client,
      newState: {id, channelId, guild: {id: '301783183828189184'}},
    });

    expect(queue.connection.destroy).not.toHaveBeenCalled();
    expect(playerMocked.clearNowPlaying).not.toHaveBeenCalled();
    expect(playerMocked.clearQueue).not.toHaveBeenCalled();
    expect(playerMocked.clearConnection).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success', async () => {
    jest.replaceProperty(queue.connection._state, 'status', VoiceConnectionStatus.Ready);
    playerMocked.getQueue.mockReturnValueOnce(queue);

    await execute({
      client,
      newState: {
        id: '909473788779958363', channelId: '-68558230535929877',
        guild: {id: '301783183828189184'},
      },
    });

    expect(queue.connection.destroy).toHaveBeenCalled();
    expect(playerMocked.clearNowPlaying).toHaveBeenCalledWith('301783183828189184');
    expect(playerMocked.clearQueue).toHaveBeenCalledWith('301783183828189184');
    expect(playerMocked.clearConnection).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
