const buttonInteraction = require('../../../resources/mocks/buttonInteraction');
const commandInteraction = require('../../../resources/mocks/commandInteraction');
const expectedParamsOnShowSuccess = require('../../../resources/actions/commands/response/expectedParamsOnShowSuccess');
const expectedParamsRemoveSuccess = require('../../../resources/actions/commands/response/expectedParamsRemoveSuccess');
const expectedParamsSetSuccess = require('../../../resources/actions/commands/response/expectedParamsSetSuccess');
const expectedParamsSetWrongRegex = require('../../../resources/actions/commands/response/expectedParamsSetWrongRegex');
const expectedParamsShowSuccess = require('../../../resources/actions/commands/response/expectedParamsShowSuccess');
const locale = require('../../configs/locale');
const responses = require('../../../resources/actions/commands/response/respones');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const responseModuleName = '../../../../main/js/db/repositories/response';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const responseMocked = jest.mock(responseModuleName).requireMock(responseModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, onButton} = require('../../../../main/js/actions/commands/response');

beforeAll(() => locale.init());

describe('execute', () => {
  describe('set', () => {
    test('forbidden', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('set');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.set');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('response', commandInteraction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(responseMocked.set).not.toHaveBeenCalled();
    });

    test('wrong regex', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('set');
      commandInteraction.options.getString.mockReturnValueOnce('())');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsSetWrongRegex);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(responseMocked.set).not.toHaveBeenCalled();
    });

    test('success', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('set');
      commandInteraction.options.getString.mockReturnValueOnce('regex')
        .mockReturnValueOnce('react');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsSetSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(responseMocked.set).toHaveBeenCalledWith('301783183828189184', {react: 'react', regex: 'regex'});
    });
  });

  describe('remove', () => {
    test('forbidden', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('remove');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.remove');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('response', commandInteraction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(responseMocked.remove).not.toHaveBeenCalled();
    });

    test('success', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('remove');
      commandInteraction.options.getString.mockReturnValueOnce('regex');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.remove');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsRemoveSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(responseMocked.remove).toHaveBeenCalledWith('301783183828189184', 'regex');
    });
  });

  describe('show', () => {
    test('forbidden', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('show');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.show');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('response', commandInteraction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('show');
      responseMocked.getAll.mockResolvedValueOnce(responses);
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.show');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsShowSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });
});

describe('onButton', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await onButton(buttonInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.show');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('response', buttonInteraction);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success', async () => {
    responseMocked.getAll.mockResolvedValueOnce(responses);
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    jest.replaceProperty(buttonInteraction, 'customId', 'next');
    jest.replaceProperty(buttonInteraction, 'message', {
      ...expectedParamsShowSuccess[1],
    });

    await onButton(buttonInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.response.show');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(buttonInteraction.update).toHaveBeenCalledWith(expectedParamsOnShowSuccess);
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });
});
