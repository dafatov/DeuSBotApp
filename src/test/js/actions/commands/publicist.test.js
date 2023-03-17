const expectParamsRemove = require('../../../resources/actions/commands/publicist/expectedParamsRemove');
const expectParamsSet = require('../../../resources/actions/commands/publicist/expectedParamsSet');
const expectParamsShow = require('../../../resources/actions/commands/publicist/expectedParamsShow');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const publicistModuleName = '../../../../main/js/db/repositories/publicist';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const publicistMocked = jest.mock(publicistModuleName).requireMock(publicistModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/actions/commands/publicist');

beforeAll(() => locale.init());

describe('execute', () => {
  describe('set', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.publicist.set');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('publicist', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(publicistMocked.set).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      interaction.options.getChannel.mockReturnValueOnce({id: '922163692940951574', name: 'deus-bot-news'});
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.publicist.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectParamsSet);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(publicistMocked.set).toHaveBeenCalledWith('301783183828189184', '922163692940951574');
    });
  });

  describe('remove', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('remove');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.publicist.remove');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('publicist', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(publicistMocked.remove).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('remove');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.publicist.remove');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectParamsRemove);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(publicistMocked.remove).toHaveBeenCalledWith('301783183828189184');
    });
  });

  describe('show', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('show');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.publicist.show');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('publicist', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('show');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      publicistMocked.getAll.mockResolvedValueOnce([
        {guild_id: '301783183828189184', channel_id: '922163692940951574'}
      ]);

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.publicist.show');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectParamsShow);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });
});
