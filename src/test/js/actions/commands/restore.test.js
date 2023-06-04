const commandInteraction = require('../../../resources/mocks/commandInteraction');
const expectedNoSnapshots = require('../../../resources/actions/commands/restore/expectedParamsNoSnapshots');
const expectedOnSelectSuccess = require('../../../resources/actions/commands/restore/expectedOnSelectSuccess');
const expectedSuccess = require('../../../resources/actions/commands/restore/expectedParamsSuccess');
const locale = require('../../configs/locale');
const selectInteraction = require('../../../resources/mocks/selectInteraction');
const snapshots = require('../../../resources/actions/commands/restore/snapshots');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const snapshotsModuleName = '../../../../main/js/db/repositories/snapshots';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const snapshotsMocked = jest.mock(snapshotsModuleName).requireMock(snapshotsModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, onSelect} = require('../../../../main/js/actions/commands/restore');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.restore');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('no snapshots', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    snapshotsMocked.getAll.mockResolvedValueOnce([]);
    commandInteraction.options.getString.mockReturnValueOnce('response');

    await execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.restore');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedNoSnapshots);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    snapshotsMocked.getAll.mockResolvedValueOnce(snapshots);
    commandInteraction.options.getString.mockReturnValueOnce('statistics');

    await execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.restore');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSuccess);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('onSelect', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await onSelect(selectInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.restore');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalled();
    expect(snapshotsMocked.restore).not.toHaveBeenCalledWith();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    snapshotsMocked.restore.mockResolvedValueOnce({table: 'table', date: new Date()});
    jest.replaceProperty(selectInteraction, 'values', ['123']);

    await onSelect(selectInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.restore');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(snapshotsMocked.restore).toHaveBeenCalledWith('123');
    expect(selectInteraction.update).toHaveBeenCalledWith(expectedOnSelectSuccess);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
