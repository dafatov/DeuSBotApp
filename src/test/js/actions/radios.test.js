const expectedSuccess = require('../../resources/actions/radios/expectedRadios');
const locale = require('../configs/locale');
const radios = require('../../resources/actions/radios/radios');

const fsMocked = jest.mock('fs').requireMock('fs');
const axiosMocked = jest.mock('axios').requireMock('axios');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {clearCache, getRadios} = require('../../../main/js/actions/radios');

beforeAll(() => locale.init());

afterEach(() => clearCache());

describe('getRadios', () => {
  test('empty data', async () => {
    fsMocked.readdirSync.mockImplementationOnce(args =>
      jest.requireActual('fs').readdirSync(args));
    axiosMocked.get.mockResolvedValueOnce({data: {result: {stations: []}}});

    const result = await getRadios();

    expect(JSON.parse(JSON.stringify(result))).toEqual({});
    expect(axiosMocked.get).toHaveBeenCalledWith('https://www.radiorecord.ru/api/stations');
  });

  test('success', async () => {
    fsMocked.readdirSync.mockImplementationOnce(args =>
      jest.requireActual('fs').readdirSync(args));
    axiosMocked.get.mockResolvedValueOnce({data: radios});

    const result = await getRadios();

    expect(JSON.parse(JSON.stringify(result))).toEqual(expectedSuccess);
    expect(axiosMocked.get).toHaveBeenCalledWith('https://www.radiorecord.ru/api/stations');
  });
});
