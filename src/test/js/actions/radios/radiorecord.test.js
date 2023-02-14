const expectedGetChannels = require('../../../resources/actions/radios/radiorecord/expectedGetChannels');
const locale = require('../../configs/locale');
const now = require('../../../resources/actions/radios/radiorecord/now');
const stations = require('../../../resources/actions/radios/radiorecord/stations');

const axiosMocked = jest.mock('axios').requireMock('axios');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {getChannels, getInfo} = require('../../../../main/js/actions/radios/radiorecord');

beforeAll(() => locale.init());

describe('getChannels', () => {
  test('success', async () => {
    axiosMocked.get.mockImplementationOnce(() => Promise.resolve({data: stations}));

    const result = await getChannels();

    expect(result).toEqual(expectedGetChannels);
  });

  test('undefined', async () => {
    axiosMocked.get.mockImplementationOnce(() => Promise.resolve({data: {}}));

    const result = await getChannels();

    expect(result).toBeUndefined();
  });
});

describe('getInfo', () => {
  test.each([
    {id: 542, expected: '\nИсточник: **SLYTEK/QUARREL**\nКомпозиция: **Body Heat**'},
    {id: 515, expected: '\nИсточник: **MIGUEL MIGS/LISA SHAW**\nКомпозиция: **Promises**'},
    {id: 559, expected: '\nИсточник: **N-TRANCE**\nКомпозиция: **Set You Free (Hixxy rmx)**'},
    {id: 43601, expected: '\nИсточник: **GAYAZOVS BROTHERS**\nКомпозиция: **Новогодняя**'},
  ])('success: $id', async ({id, expected}) => {
    axiosMocked.get.mockImplementationOnce(() => Promise.resolve({data: now}));

    const result = await getInfo(id);

    expect(result).toEqual(expected);
  });

  test.each([
    {id: 23, data: now},
    {id: undefined, data: now},
    {id: '542', data: now},
    {id: 542, data: undefined},
  ])('failure: $id, $data', async ({id, data}) => {
    axiosMocked.get.mockImplementationOnce(() => Promise.resolve({data}));

    const result = await getInfo(id);

    expect(result).toEqual('\nПроизошла ошибка при получении данных. Просьба сообщить о проблеме');
  });
});
