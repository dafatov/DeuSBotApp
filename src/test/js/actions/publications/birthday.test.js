const client = require('../../../resources/mocks/client');
const expected = require('../../../resources/actions/publications/birthdays/expectedContent');
const locale = require('../../configs/locale');

const birthdaysModuleName = '../../../../main/js/db/repositories/birthday';
const birthdaysMocked = jest.mock(birthdaysModuleName).requireMock(birthdaysModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {condition, content} = require('../../../../main/js/actions/publications/birthday');

beforeAll(() => locale.init());

describe('content', () => {
  test('success', async () => {
    birthdaysMocked.getTodayBirthdayUserIds.mockImplementationOnce(() => Promise.resolve([
      '348774809003491329', '233923369685352449',
    ]));

    const result = await content(client);

    expect(result).toEqual(expected);
  });

  test('empty', async () => {
    birthdaysMocked.getTodayBirthdayUserIds.mockImplementationOnce(() => Promise.resolve([]));

    const result = await content(client);

    expect(result).toBeUndefined();
  });
});

describe('condition', () => {
  test.each([
    {now: new Date('2023-02-11T09:38:00.000Z'), expected: false},
    {now: new Date('2023-02-12T18:00:00.000Z'), expected: true},
    {now: new Date('2023-02-13T17:59:59.000Z'), expected: false},
    {now: new Date('2023-02-14T18:00:32.000Z'), expected: true},
  ])('$now', ({now, expected}) => {
    const result = condition(now);

    expect(result).toBe(expected);
  });
});
