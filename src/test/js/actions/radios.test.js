const expectedSuccess = require('../../resources/actions/radios/expectedRadios');
const locale = require('../configs/locale');
const {mapToArray} = require('../../../main/js/utils/array');
const radios = require('../../resources/actions/radios/radios');

const auditorModuleName = '../../../main/js/actions/auditor';
const fsMocked = jest.mock('fs').requireMock('fs');
const axiosMocked = jest.mock('axios').requireMock('axios');
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {init, getRadios} = require('../../../main/js/actions/radios');

beforeAll(() => locale.init());

afterEach(() => getRadios().clear());

describe('init', () => {
  test('success', async () => {
    fsMocked.readdirSync.mockImplementationOnce(args =>
      jest.requireActual('fs').readdirSync(args));
    axiosMocked.get.mockResolvedValue({data: radios});

    await init();

    expect(mapToArray(getRadios())).toEqual(expectedSuccess);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test.each([
    {dir: [], expected: []},
    {dir: ['_ping'], expected: []},
    {dir: ['test.jsx'], expected: []},
  ])('empty: $dir', async ({dir, expected}) => {
    fsMocked.readdirSync.mockImplementationOnce(() => dir);

    await init();

    expect(mapToArray(getRadios())).toEqual(expected);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
