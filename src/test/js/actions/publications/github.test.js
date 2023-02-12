const client = require('../../../resources/mocks/client');
const events = require('../../../resources/actions/publications/github/events.js');
const expected = require('../../../resources/actions/publications/github/expectedContent.js');
const locale = require('../../configs/locale');

const variablesModuleName = '../../../../main/js/db/repositories/variables';
const variablesMocked = jest.mock(variablesModuleName).requireMock(variablesModuleName);
const octokitMocked = jest.mock('@octokit/core').requireMock('@octokit/core');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {condition, content, onPublished} = require('../../../../main/js/actions/publications/github');

beforeAll(() => locale.init());

afterEach(() => {
  jest.clearAllMocks();
});

describe('content', () => {
  test('success', async () => {
    variablesMocked.getAll.mockImplementationOnce(() => Promise.resolve({lastIssueEvent: new Date(0)}));
    octokitMocked.Octokit.mockImplementationOnce(() => ({
      request: jest.fn(() => Promise.resolve({data: events})),
    }));

    const result = await content(client);

    expect(result).toEqual(expected);
  });
});

describe('condition', () => {
  test.each([
    {now: new Date('2023-02-13T09:38:00'), expected: false},
    {now: new Date('2023-02-13T02:39:00'), expected: false},
    {now: new Date('2023-02-13T12:40:00'), expected: true},
    {now: new Date('2023-02-13T07:00:00'), expected: true},
  ])('$now', ({now, expected}) => {
    const result = condition(now);

    expect(result).toBe(expected);
  });
});

describe('onPublished', () => {
  test('success', async () => {
    const variables = {lastIssueEvent: new Date(0)};
    variablesMocked.set.mockImplementationOnce();

    await onPublished(null, variables);

    expect(variablesMocked.set).toHaveBeenCalled();
    expect(variablesMocked.set).toHaveBeenCalledWith('lastIssueEvent', variables.lastIssueEvent);
  });

  test('failure', async () => {
    variablesMocked.set.mockImplementationOnce();

    await onPublished(null, null);

    expect(variablesMocked.set).not.toHaveBeenCalled();
  });
});
