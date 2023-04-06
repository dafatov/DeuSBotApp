const locale = require('../../configs/locale');
const message = require('../../../resources/mocks/message');

const responsesModuleName = '../../../../main/js/db/repositories/responses';
const auditorModuleName = '../../../../main/js/actions/auditor';
const responsesMocked = jest.mock(responsesModuleName).requireMock(responsesModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/events/messageCreate/response');

beforeAll(() => locale.init());

describe('execute', () => {
  test('bot', async () => {
    jest.replaceProperty(message.author, 'bot', true);

    await execute({message});

    expect(message.reply).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('semi match', async () => {
    jest.replaceProperty(message.author, 'bot', false);
    jest.replaceProperty(message, 'content', 'test1');
    responsesMocked.getAll.mockResolvedValueOnce([
      {regex: 'test1', react: 'test1R'}, {regex: 'test2', react: 'test2R'},
    ]);

    await execute({message});

    expect(message.reply).toHaveBeenCalledWith('test1R');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('full match', async () => {
    jest.replaceProperty(message.author, 'bot', false);
    jest.replaceProperty(message, 'content', 'test1test2');
    responsesMocked.getAll.mockResolvedValueOnce([
      {regex: 'test1', react: 'test1R'}, {regex: 'test2', react: 'test2R'},
    ]);

    await execute({message});

    expect(message.reply).toHaveBeenCalledTimes(2);
    expect(message.reply).toHaveBeenNthCalledWith(1, 'test1R');
    expect(message.reply).toHaveBeenNthCalledWith(2, 'test2R');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
