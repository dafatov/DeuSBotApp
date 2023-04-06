const locale = require('../../configs/locale');

const statisticsModuleName = '../../../../main/js/db/repositories/statistics';
const sessionModuleName = '../../../../main/js/db/repositories/session';
const auditorModuleName = '../../../../main/js/actions/auditor';
const statisticsMocked = jest.mock(statisticsModuleName).requireMock(statisticsModuleName);
const sessionMocked = jest.mock(sessionModuleName).requireMock(sessionModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/events/voiceStateUpdate/session');

beforeAll(() => locale.init());

describe('execute', () => {
  test.each([
    {oldChannelId: null, newChannelId: null},
    {oldChannelId: '32423', newChannelId: '32423'},
    {oldChannelId: '32423', newChannelId: '72843'}
  ])('nothing happen: {$oldChannelId, $newChannelId}', async ({oldChannelId, newChannelId}) => {
    const state = {oldState: {channelId: oldChannelId}, newState: {channelId: newChannelId}};

    await execute(state);

    expect(statisticsMocked.update).not.toHaveBeenCalled();
    expect(sessionMocked.begin).not.toHaveBeenCalled();
    expect(sessionMocked.finish).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success: begin', async () => {
    const state = {
      oldState: {channelId: null},
      newState: {guild: {id: '301783183828189184'}, channelId: '32423', member: {user: {id: '348774809003491329'}}},
    };

    await execute(state);

    expect(statisticsMocked.update).not.toHaveBeenCalled();
    expect(sessionMocked.begin).toHaveBeenCalledWith('348774809003491329', '301783183828189184');
    expect(sessionMocked.finish).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success: finish', async () => {
    const state = {
      oldState: {channelId: '32423', guild: {id: '301783183828189184'}, member: {user: {id: '348774809003491329'}}},
      newState: {channelId: null},
    };
    sessionMocked.finish.mockResolvedValueOnce({
      rows: [
        {
          user_id: '348774809003491329',
          guild_id: '301783183828189184',
          begin: '2023-03-26 18:28:12.562670 +00:00',
          finish: '2023-03-26 21:03:10.606441 +00:00',
        },
      ],
    });

    await execute(state);

    expect(statisticsMocked.update).toHaveBeenCalledWith(
      '348774809003491329', '301783183828189184', {
        voiceDuration:
          {begin: '2023-03-26 18:28:12.562670 +00:00', finish: '2023-03-26 21:03:10.606441 +00:00'},
      },
    );
    expect(sessionMocked.begin).not.toHaveBeenCalled();
    expect(sessionMocked.finish).toHaveBeenCalledWith('348774809003491329', '301783183828189184');
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });
});
