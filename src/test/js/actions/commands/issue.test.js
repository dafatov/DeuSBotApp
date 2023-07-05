const commandInteraction = require('../../../resources/mocks/commandInteraction');
const expectModal = require('../../../resources/actions/commands/issue/expectedModal');
const expectParams = require('../../../resources/actions/commands/issue/expectedParams');
const issue = require('../../../resources/actions/commands/issue/issue');
const locale = require('../../configs/locale');
const modalSubmitInteraction = require('../../../resources/mocks/modalSubmitInteraction');
const user = require('../../../resources/mocks/user');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const githubModuleName = '../../../../main/js/api/external/github';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const githubApiMocked = jest.mock(githubModuleName).requireMock(githubModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, onModal} = require('../../../../main/js/actions/commands/issue');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.issue');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('issue', commandInteraction);
    expect(commandInteraction.showModal).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    commandInteraction.options.getString.mockReturnValueOnce('bug');

    await execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.issue');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandInteraction.showModal).toHaveBeenCalledWith(expectModal);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('onModal', () => {
  test('success', async () => {
    githubApiMocked.createIssue.mockResolvedValueOnce(issue);
    jest.replaceProperty(modalSubmitInteraction, 'customId', 'issue bug');
    modalSubmitInteraction.fields.getTextInputValue
      .mockReturnValueOnce('title')
      .mockReturnValueOnce('details');

    await onModal(modalSubmitInteraction);

    expect(modalSubmitInteraction.deferReply).toHaveBeenCalled();
    expect(modalSubmitInteraction.fields.getTextInputValue).toHaveBeenCalledTimes(2);
    expect(modalSubmitInteraction.fields.getTextInputValue).toHaveBeenNthCalledWith(1, 'title');
    expect(modalSubmitInteraction.fields.getTextInputValue).toHaveBeenNthCalledWith(2, 'details');
    expect(githubApiMocked.createIssue).toHaveBeenCalledWith(user, {details: 'details', title: 'title', type: 'bug'});
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectParams);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
