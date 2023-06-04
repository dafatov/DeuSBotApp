const client = require('../../resources/mocks/client');
const locale = require('../configs/locale');

const auditorModuleName = '../../../main/js/actions/auditor';
const snapshotsDbModuleName = '../../../main/js/db/repositories/snapshots';
const fsMocked = jest.mock('fs').requireMock('fs');
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const snapshotsDbMocked = jest.mock(snapshotsDbModuleName).requireMock(snapshotsDbModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {init} = require('../../../main/js/actions/backup');

beforeAll(() => locale.init());

describe('init', () => {
  test('success', async () => {
    const getHasGuildIdMocked = table => Promise.resolve(({
      audit: true, birthday: true, changelog: false, permission: false, publicist: true,
      queue: true, response: true, session: true, statistics: true, user: false, variables: false,
    })[table]);
    fsMocked.readdirSync.mockImplementationOnce(args =>
      jest.requireActual('fs').readdirSync(args));
    Array(11).fill().forEach(() => snapshotsDbMocked.getHasGuildId
      .mockImplementationOnce(getHasGuildIdMocked));

    await init(client);

    expect(snapshotsDbMocked.getHasGuildId).toHaveBeenCalledTimes(10);
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(1, 'changelog');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(2, 'permission');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(3, 'user');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(4, 'variables');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(5, 'birthday', '301783183828189184');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(6, 'birthday', '905052154027475004');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(7, 'publicist', '301783183828189184');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(8, 'publicist', '905052154027475004');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(9, 'queue', '301783183828189184');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(10, 'queue', '905052154027475004');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(11, 'response', '301783183828189184');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(12, 'response', '905052154027475004');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(13, 'session', '301783183828189184');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(14, 'session', '905052154027475004');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(15, 'statistics', '301783183828189184');
    expect(snapshotsDbMocked.backup).toHaveBeenNthCalledWith(16, 'statistics', '905052154027475004');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test.each([
    {dir: []},
    {dir: ['user']},
    {dir: ['snapshots.js']},
  ])('empty: $dir', async ({dir}) => {
    fsMocked.readdirSync.mockImplementationOnce(() => dir);

    await init(client);

    expect(snapshotsDbMocked.getHasGuildId).not.toHaveBeenCalled();
    expect(snapshotsDbMocked.backup).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
