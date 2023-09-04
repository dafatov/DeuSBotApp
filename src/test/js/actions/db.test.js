const locale = require('../configs/locale');

const auditorModuleName = '../../../main/js/actions/auditor';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const migrationMocked = jest.mock('postgres-migrations').requireMock('postgres-migrations');

// eslint-disable-next-line sort-imports-requires/sort-requires
const db = require('../../../main/js/actions/db');

beforeAll(() => locale.init());

describe('init', () => {
  test('success', async () => {
    const clientMocked = {t: 't'};
    const connectMocked = jest.fn().mockResolvedValueOnce(clientMocked);
    const poolMocked = {connect: connectMocked};
    jest.replaceProperty(db, 'db', poolMocked);

    await db.init();

    expect(connectMocked).toHaveBeenCalledWith();
    expect(migrationMocked.migrate).toHaveBeenCalledWith({client: clientMocked}, 'src/main/js/db/migrations', {});
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
