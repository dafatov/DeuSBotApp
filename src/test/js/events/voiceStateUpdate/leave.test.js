const {Collection} = require('discord.js');
const client = require('../../../resources/mocks/client');
const locale = require('../../configs/locale');

const auditorModuleName = '../../../../main/js/actions/auditor';
const playerModuleName = '../../../../main/js/actions/player';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/events/voiceStateUpdate/leave');

beforeAll(() => locale.init());

describe('execute', () => {
  test('no connection', async () => {
    playerMocked.isConnected.mockReturnValueOnce(false);

    await execute({client, newState: {guild: {id: '301783183828189184'}}});

    expect(playerMocked.destroyConnection).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {id: '909473788779958363', channelId: '668558230535929877'},
    {id: '-909473788779958363', channelId: '668558230535929877'},
    {id: '-909473788779958363', channelId: '-668558230535929877'},
  ])('no leave: {$id, $channelId}', async ({id, channelId}) => {
    playerMocked.isConnected.mockReturnValueOnce(true);
    playerMocked.isSameChannel.mockReturnValueOnce(channelId === '668558230535929877');

    await execute({
      client,
      newState: {
        channelId, guild: {
          id: '301783183828189184', channels: {
            fetch: () => Promise.resolve({
              members: new Collection([
                ['1', {user: {bot: true}}], ['2', {user: {bot: false}}],
              ]),
            }),
          },
        }, member: {user: {id}},
      },
    });

    expect(playerMocked.destroyConnection).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success', async () => {
    playerMocked.isConnected.mockReturnValueOnce(true);

    await execute({
      client,
      newState: {
        channelId: '-68558230535929877', guild: {id: '301783183828189184'},
        member: {user: {id: '909473788779958363'}},
      },
    });

    expect(playerMocked.destroyConnection).toHaveBeenCalledWith('301783183828189184');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
