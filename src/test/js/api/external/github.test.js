const client = require('../../../resources/mocks/client');
const events = require('../../../resources/api/external/github/events');
const expectedEvents = require('../../../resources/api/external/github/expectedEvents');
const expectedIssue = require('../../../resources/api/external/github/expectedIssue');

const auditorModuleName = '../../../../main/js/actions/auditor';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const octokitMocked = jest.mock('@octokit/core').requireMock('@octokit/core');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {createIssue, getEvents} = require('../../../../main/js/api/external/github');

beforeAll(() => {
  process.env.GITHUB_LOGIN = 'dafatov';
  process.env.GITHUB_REPOSITORY = 'DeusBot';
});

describe('createIssue', () => {
  test('success', async () => {
    const requestMocked = jest.fn().mockResolvedValueOnce({data: expectedIssue});
    octokitMocked.Octokit.mockImplementationOnce(() => ({
      request: requestMocked,
    }));

    const result = await createIssue(client.user, {type: 'bug', title: 'title', details: 'details'});

    expect(result).toEqual(expectedIssue);
    expect(requestMocked).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/issues', {
      body: 'details', labels: ['@<348774809003491329>', 'bug', 'discord-auto'],
      owner: 'dafatov', repo: 'DeusBot', title: 'title',
    });
  });

  test('failure', async () => {
    const requestMocked = jest.fn().mockRejectedValueOnce();
    octokitMocked.Octokit.mockImplementationOnce(() => ({
      request: requestMocked,
    }));

    const result = () => createIssue(client.user, {type: 'bug', title: 'title', details: 'details'});

    await expect(result()).rejects.toBeUndefined();
    expect(requestMocked).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/issues', {
      body: 'details', labels: ['@<348774809003491329>', 'bug', 'discord-auto'],
      owner: 'dafatov', repo: 'DeusBot', title: 'title',
    });
  });
});

describe('getEvents', () => {
  test('success', async () => {
    const expectedUrl = 'GET /repos/{owner}/{repo}/issues/events';
    const requestMocked = jest.fn().mockResolvedValueOnce({data: events[0]})
      .mockResolvedValueOnce({data: events[1]})
      .mockResolvedValueOnce({data: []});
    octokitMocked.Octokit.mockImplementationOnce(() => ({
      request: requestMocked,
    }));

    const result = await getEvents(new Date('1970-01-01T00:00:00.000Z'));

    expect(result).toEqual(expectedEvents);
    expect(requestMocked).toHaveBeenCalledTimes(3);
    expect(requestMocked).toHaveBeenNthCalledWith(1,
      expectedUrl, {owner: 'dafatov', page: 1, per_page: 30, repo: 'DeusBot'},
    );
    expect(requestMocked).toHaveBeenNthCalledWith(2,
      expectedUrl, {owner: 'dafatov', page: 2, per_page: 30, repo: 'DeusBot'},
    );
    expect(requestMocked).toHaveBeenNthCalledWith(3,
      expectedUrl, {owner: 'dafatov', page: 3, per_page: 30, repo: 'DeusBot'},
    );
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('failure', async () => {
    const requestMocked = jest.fn().mockRejectedValueOnce();
    octokitMocked.Octokit.mockImplementationOnce(() => ({
      request: requestMocked,
    }));

    const result = await getEvents(new Date('1970-01-01T00:00:00.000Z'));

    expect(result).toEqual([]);
    expect(requestMocked).toHaveBeenCalledTimes(1);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
