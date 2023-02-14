const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');
const successNotify = require('../../../resources/actions/commands/ping/expectedParams');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/actions/commands/ping');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.ping');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('ping', interaction);
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.ping');
    expect(commandsMocked.notify).toHaveBeenCalledWith(...successNotify);
    expect(auditMocked.audit).toHaveBeenCalled();
  });
});
