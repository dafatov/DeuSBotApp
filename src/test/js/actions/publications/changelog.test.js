const changelogs = require('../../../resources/actions/publications/changelog/changelogs');
const client = require('../../../resources/mocks/client');
const expectedContent = require('../../../resources/actions/publications/changelog/expectedContent');
const locale = require('../../configs/locale');

const changelogModuleName = '../../../../main/js/db/repositories/changelog';
const changelogMocked = jest.mock(changelogModuleName).requireMock(changelogModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {condition, content, onPublished} = require('../../../../main/js/actions/publications/changelog');

beforeAll(() => locale.init());

describe('content', () => {
  test('success', async () => {
    changelogMocked.getUnshown.mockImplementationOnce(() =>
      Promise.resolve(changelogs));

    const result = await content(client);

    expect(result).toEqual(expectedContent);
  });

  test('empty', async () => {
    changelogMocked.getUnshown.mockImplementationOnce(() =>
      Promise.resolve([]));

    const result = await content(client);

    expect(result).toEqual({});
  });
});

describe('condition', () => {
  test.each([
    {changelogs, expected: true},
    {changelogs: [], expected: false},
  ])('$changelogs', async ({changelogs, expected}) => {
    changelogMocked.getUnshown.mockImplementationOnce(() =>
      Promise.resolve(changelogs));

    const result = await condition(client);

    expect(result).toBe(expected);
  });
});

describe('onPublished', () => {
  test('success', async () => {
    const reactMocked = jest.fn().mockResolvedValue();
    const variables = expectedContent.variables;
    const messages = [
      {
        react: reactMocked,
      }, {
        react: reactMocked,
      },
    ];
    changelogMocked.shown.mockImplementationOnce();

    await onPublished(messages, variables);

    expect(reactMocked).toHaveBeenCalledTimes(4);
    expect(reactMocked).toHaveBeenNthCalledWith(1, '👍');
    expect(reactMocked).toHaveBeenNthCalledWith(2, '👍');
    expect(reactMocked).toHaveBeenNthCalledWith(3, '👎');
    expect(reactMocked).toHaveBeenNthCalledWith(4, '👎');
    expect(changelogMocked.shown).toHaveBeenCalledTimes(4);
    expect(changelogMocked.shown).toHaveBeenNthCalledWith(1,
      variables.shownChangelogs[0].version,
      variables.shownChangelogs[0].application,
    );
    expect(changelogMocked.shown).toHaveBeenNthCalledWith(2,
      variables.shownChangelogs[1].version,
      variables.shownChangelogs[1].application,
    );
    expect(changelogMocked.shown).toHaveBeenNthCalledWith(3,
      variables.shownChangelogs[2].version,
      variables.shownChangelogs[2].application,
    );
    expect(changelogMocked.shown).toHaveBeenNthCalledWith(4,
      variables.shownChangelogs[3].version,
      variables.shownChangelogs[3].application,
    );
  });

  test.each([
    {messages: [], variables: {shownChangelogs: []}},
    {messages: null, variables: null}
  ])('empty: {$messages, $variables}', async ({messages, variables}) => {
    changelogMocked.shown.mockImplementationOnce();

    await onPublished(messages, variables);

    expect(changelogMocked.shown).not.toHaveBeenCalled();
  });
});
