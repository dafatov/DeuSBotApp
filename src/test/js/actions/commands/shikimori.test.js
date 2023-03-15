const animesJson = require('../../../resources/actions/commands/shikimori/animesJson');
const animesXml = require('../../../resources/actions/commands/shikimori/animesXml');
const expectedPlayNoRandom = require('../../../resources/actions/commands/shikimori/expectedParamsPlayNoRandom');
const expectedPlaySuccess = require('../../../resources/actions/commands/shikimori/expectedParamsPlaySuccess');
const expectedPlayUnboundCount = require('../../../resources/actions/commands/shikimori/expectedParamsPlayUnboundCount');
const expectedRemoveSuccess = require('../../../resources/actions/commands/shikimori/expectedParamsRemoveSuccess');
const expectedSetNonExistLogin = require('../../../resources/actions/commands/shikimori/expectedParamsSetNonExistLogin');
const expectedSetSuccess = require('../../../resources/actions/commands/shikimori/expectedParamsSetSuccess');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const usersDbModuleName = '../../../../main/js/db/repositories/users';
const playModuleName = '../../../../main/js/actions/commands/play';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const usersDbMocked = jest.mock(usersDbModuleName).requireMock(usersDbModuleName);
const axiosMocked = jest.mock('axios').requireMock('axios');
const randomOrgMocked = jest.mock('random-org').requireMock('random-org');
const playMocked = jest.mock(playModuleName).requireMock(playModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, play} = require('../../../../main/js/actions/commands/shikimori');

beforeAll(() => locale.init());

describe('execute', () => {
  describe('play', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('play');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      const result = await execute(interaction);

      expect(result).toEqual({'result': 'Доступ к команде shikimori запрещен'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('shikimori', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalledWith();
      expect(auditMocked.audit).not.toHaveBeenCalled();
      expect(playMocked.searchSongs).not.toHaveBeenCalled();
    });

    test.each([
      {count: -4},
      {count: 0},
      {count: 1000},
    ])('unbound count: $count', async ({count}) => {
      interaction.options.getSubcommand.mockReturnValueOnce('play');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      interaction.options.getInteger.mockReturnValueOnce(count);

      const result = await execute(interaction);

      expect(result).toEqual({'result': 'Некорректное количество выбранных композиций'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedPlayUnboundCount);
      expect(auditMocked.audit).toHaveBeenCalled();
      expect(playMocked.searchSongs).not.toHaveBeenCalled();
    });

    test('no random', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('play');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      interaction.options.getInteger.mockReturnValueOnce(2);
      axiosMocked.get.mockResolvedValue({data: animesJson});
      randomOrgMocked.mockImplementationOnce(() => ({
        generateIntegers: jest.fn().mockResolvedValue({requestsLeft: 0, random: {data: [1, 4]}})
      }));

      const result = await execute(interaction);

      expect(result).toEqual({'result': 'Рандом random.org закончился'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedPlayNoRandom);
      expect(auditMocked.audit).toHaveBeenCalled();
      expect(playMocked.searchSongs).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('play');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      interaction.options.getInteger.mockReturnValueOnce(2);
      interaction.options.getString.mockReturnValueOnce('login');
      axiosMocked.get.mockResolvedValue({data: animesJson});
      randomOrgMocked.mockImplementationOnce(() => ({
        generateIntegers: jest.fn().mockResolvedValue({requestsLeft: 3, random: {data: [1, 4]}})
      }));

      const result = await execute(interaction);

      expect(result).toEqual({'count': 2, 'login': 'login'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedPlaySuccess);
      expect(auditMocked.audit).toHaveBeenCalled();
      expect(playMocked.searchSongs).toHaveBeenCalledWith(interaction, true,
        ['Steins;Gate +ending 1 +full', 'Code Geass: Hangyaku no Lelouch R2 +opening 1 +full'], 'login');
    });
  });

  describe('set', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.set');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('shikimori', interaction);
      expect(axiosMocked.get).not.toHaveBeenCalled();
      expect(usersDbMocked.set).not.toHaveBeenCalled();
      expect(commandsMocked.updateCommands).not.toHaveBeenCalled();
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditMocked.audit).not.toHaveBeenCalled();
    });

    test('non-existent profile shikimori', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      interaction.options.getString.mockReturnValueOnce('login');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      axiosMocked.get.mockImplementationOnce(() => {
        throw new Error('wrong user');
      });

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(axiosMocked.get).toHaveBeenCalledWith('https://shikimori.one/login');
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSetNonExistLogin);
      expect(auditMocked.audit).toHaveBeenCalled();
      expect(usersDbMocked.set).not.toHaveBeenCalled();
      expect(commandsMocked.updateCommands).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      interaction.options.getString.mockReturnValueOnce('login')
        .mockReturnValueOnce('nickname');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      axiosMocked.get.mockResolvedValue({status: 200});
      usersDbMocked.set.mockReturnValueOnce();

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(axiosMocked.get).toHaveBeenCalledWith('https://shikimori.one/login');
      expect(usersDbMocked.set).toHaveBeenCalledWith({'login': 'login', 'nickname': 'nickname'});
      expect(commandsMocked.updateCommands).toHaveBeenCalledWith(interaction.client);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSetSuccess);
      expect(auditMocked.audit).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('remove');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.remove');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('shikimori', interaction);
      expect(usersDbMocked.removeByLogin).not.toHaveBeenCalled();
      expect(commandsMocked.updateCommands).not.toHaveBeenCalled();
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('remove');
      interaction.options.getString.mockReturnValueOnce('login');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      axiosMocked.get.mockResolvedValue({status: 200});
      usersDbMocked.set.mockReturnValueOnce();

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.remove');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(usersDbMocked.removeByLogin).toHaveBeenCalledWith('login');
      expect(commandsMocked.updateCommands).toHaveBeenCalledWith(interaction.client);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedRemoveSuccess);
      expect(auditMocked.audit).toHaveBeenCalled();
    });
  });

  describe('oExport', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('export');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.export');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('shikimori', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('export');
      interaction.options.getString.mockReturnValueOnce('nickname');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      axiosMocked.get.mockResolvedValue({data: animesXml});

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.export');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalled();
      expect(auditMocked.audit).toHaveBeenCalled();
    });
  });
});

describe('play', () => {
  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    axiosMocked.get.mockResolvedValue({data: animesJson});
    randomOrgMocked.mockImplementationOnce(() => ({
      generateIntegers: jest.fn().mockResolvedValue({requestsLeft: 3, random: {data: [1, 4]}})
    }));

    const result = await play(interaction, false, 'login', 2);

    expect(result).toEqual({'count': 2, 'login': 'login'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditMocked.audit).toHaveBeenCalled();
    expect(playMocked.searchSongs).toHaveBeenCalledWith(interaction, false,
      ['Steins;Gate +ending 1 +full', 'Code Geass: Hangyaku no Lelouch R2 +opening 1 +full'], 'login');
  });
});
