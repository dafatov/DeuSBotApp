const httpsMocked = jest.mock('https').requireMock('https');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {getStream} = require('../../../../main/js/api/external/common');

describe('getStream', () => {
  test('success', async () => {
    httpsMocked.get.mockImplementationOnce((_, callback) => callback('response'));

    const result = await getStream('some url');

    expect(result).toEqual('response');
    expect(httpsMocked.get).toHaveBeenCalledWith('some url', expect.any(Function));
  });
});
