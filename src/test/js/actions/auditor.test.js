const {CATEGORIES, TYPES} = require('../../../main/js/db/repositories/audit');
const audit = require('../../resources/actions/auditor/audit');
const client = require('../../resources/mocks/client');
const locale = require('../configs/locale');

const auditDbModuleName = '../../../main/js/db/repositories/audit';
const stringModuleName = '../../../main/js/utils/string';
const auditDbMocked = jest.mock(auditDbModuleName).requireMock(auditDbModuleName);
const stringMocked = jest.mock(stringModuleName, () => ({
  ...jest.requireActual(stringModuleName),
  getStackTrace: jest.fn(),
})).requireMock(stringModuleName);
jest.spyOn(console, 'log').mockReturnValue();

// eslint-disable-next-line sort-imports-requires/sort-requires
const auditor = require('../../../main/js/actions/auditor');

beforeAll(() => locale.init());

describe('init', () => {
  test('no exactly time', async () => {
    jest.useFakeTimers({now: new Date('2023-02-06T10:00:27.013Z').getTime()});
    jest.spyOn(auditor, 'audit').mockReturnValueOnce();
    jest.spyOn(global, 'setTimeout').mockReturnValueOnce();

    await auditor.init();

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 62987);
    expect(auditDbMocked.removeBeforeWithOffset).not.toHaveBeenCalled();
    expect(auditor.audit).toHaveBeenCalledTimes(1);
  });

  test('no removed', async () => {
    jest.useFakeTimers({now: new Date('2023-02-06T00:00:27.013Z').getTime()});
    jest.spyOn(auditor, 'audit').mockReturnValueOnce();
    jest.spyOn(global, 'setTimeout').mockReturnValueOnce();
    auditDbMocked.removeBeforeWithOffset.mockResolvedValueOnce({rowCount: 0});

    await auditor.init();

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 62987);
    expect(auditDbMocked.removeBeforeWithOffset).toHaveBeenCalledWith('1M');
    expect(auditor.audit).toHaveBeenCalledTimes(1);
  });

  test('success', async () => {
    jest.useFakeTimers({now: new Date('2023-02-06T00:00:27.013Z').getTime()});
    jest.spyOn(auditor, 'audit').mockReturnValueOnce().mockReturnValueOnce();
    jest.spyOn(global, 'setTimeout').mockReturnValueOnce();
    auditDbMocked.removeBeforeWithOffset.mockResolvedValueOnce({rowCount: 23});

    await auditor.init();

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 62987);
    expect(auditDbMocked.removeBeforeWithOffset).toHaveBeenCalledWith('1M');
    expect(auditor.audit).toHaveBeenCalledTimes(2);
  });
});

describe('audit', () => {
  test('wrong type', async () => {
    auditDbMocked.add.mockResolvedValueOnce();
    process.env.LOGGING = 'INFO';

    await auditor.audit({
      guildId: '905052154027475004',
      type: 'type',
      category: CATEGORIES.AUDITOR,
      message: 'test message',
    });

    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      '[Log][  error][       auditor][                  ]: Не существует такого типа: "type". Вместо него будет использован "error"',
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenNthCalledWith(
      2,
      '[Log][  error][       auditor][905052154027475004]: test message',
    );
  });

  test('wrong category', async () => {
    auditDbMocked.add.mockResolvedValueOnce();
    process.env.LOGGING = 'INFO';

    await auditor.audit({
      guildId: '905052154027475004',
      type: TYPES.INFO,
      category: 'category',
      message: 'test message',
    });

    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      '[Log][  error][       auditor][                  ]: Не существует такой категории: "category"',
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenNthCalledWith(
      2,
      '[Log][   info][ uncategorized][905052154027475004]: test message',
    );
  });

  test('debug type', async () => {
    auditDbMocked.add.mockResolvedValueOnce();
    process.env.LOGGING = 'INFO';

    await auditor.audit({
      guildId: '905052154027475004',
      type: TYPES.DEBUG,
      category: CATEGORIES.AUDITOR,
      message: 'test message',
    });

    // eslint-disable-next-line no-console
    expect(console.log).not.toHaveBeenCalled();
  });

  test('info type', async () => {
    auditDbMocked.add.mockResolvedValueOnce();
    process.env.LOGGING = 'INFO';

    await auditor.audit({
      guildId: '905052154027475004',
      type: TYPES.INFO,
      category: CATEGORIES.AUDITOR,
      message: 'test message',
    });

    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalledWith(
      '[Log][   info][       auditor][905052154027475004]: test message');
  });

  test('logging debug', async () => {
    auditDbMocked.add.mockResolvedValueOnce();
    stringMocked.getStackTrace.mockReturnValueOnce('stack trace');
    process.env.LOGGING = 'DEBUG';

    await auditor.audit({
      guildId: '905052154027475004',
      type: TYPES.INFO,
      category: CATEGORIES.AUDITOR,
      message: 'test message',
    });

    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      '[Log][   info][       auditor][905052154027475004]: test message',
    );
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenNthCalledWith(2,'stack trace');
  });
});

describe('getGuilds', () => {
  test('success', async () => {
    auditDbMocked.getAll.mockResolvedValueOnce(audit);

    const result = await auditor.getGuilds(client);

    expect(result).toEqual('[{"id":"301783183828189184","name":"CRINGE-A-LOT"},{"id":"905052154027475004","name":"Among Булок"}]');
  });
});
