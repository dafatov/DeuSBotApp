const expectParams = require('../../../resources/actions/commands/issue/expectedParams');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const octokitMocked = jest.mock('@octokit/core').requireMock('@octokit/core');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/actions/commands/issue');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.issue');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('issue', interaction);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success', async () => {
    const requestMocked = jest.fn();
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    interaction.options.getString.mockReturnValueOnce('type')
      .mockReturnValueOnce('title').mockReturnValueOnce('details');
    octokitMocked.Octokit.mockImplementationOnce(() => ({
      request: requestMocked.mockImplementationOnce(() => Promise.resolve({data: {html_url: 'https://youtube.com'}})),
    }));
    process.env.GITHUB_LOGIN = 'login';
    process.env.GITHUB_REPOSITORY = 'repository';

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.issue');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectParams);
    expect(auditorMocked.audit).toHaveBeenCalled();
    expect(requestMocked).toHaveBeenCalledWith('POST /repos/{owner}/{repo}/issues', {
      body: 'details', labels: ['<@348774809003491329>', 'type', 'discord-auto'],
      owner: 'login', repo: 'repository', title: 'title',
    });
  });
});
