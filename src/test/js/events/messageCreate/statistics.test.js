const locale = require('../../configs/locale');
const message = require('../../../resources/mocks/message');

const statisticsModuleName = '../../../../main/js/db/repositories/statistics';
const statisticsMocked = jest.mock(statisticsModuleName).requireMock(statisticsModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/events/messageCreate/statistics');

beforeAll(() => locale.init());

describe('execute', () => {
  test('webhookId', async () => {
    jest.replaceProperty(message, 'webhookId', '224398131');

    const result = await execute({message});

    expect(result).toBe();
    expect(statisticsMocked.update).not.toHaveBeenCalled();
  });

  test('success', async () => {
    jest.replaceProperty(message, 'webhookId', null);
    statisticsMocked.update.mockResolvedValueOnce();

    const result = await execute({message});

    expect(result).toBe();
    expect(statisticsMocked.update).toHaveBeenCalledWith(
      '348774809003491329', '301783183828189184', {messageCount: 1},
    );
  });
});
