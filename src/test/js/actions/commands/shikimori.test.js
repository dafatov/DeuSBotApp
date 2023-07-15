const animesJson = require('../../../resources/actions/commands/shikimori/animesJson');
const cloneDeep = require('lodash/cloneDeep');
const expectedPlayNoRandom = require('../../../resources/actions/commands/shikimori/expectedParamsPlayNoRandom');
const expectedPlaySearch = require('../../../resources/actions/commands/shikimori/expectedParamsPlaySearch');
const expectedPlaySuccess = require('../../../resources/actions/commands/shikimori/expectedPlaySuccess');
const expectedPlaySuccessAdded = require('../../../resources/actions/commands/shikimori/expectedPlaySuccessAdded');
const expectedPlayUnboundCount = require('../../../resources/actions/commands/shikimori/expectedParamsPlayUnboundCount');
const expectedRemoveSuccess = require('../../../resources/actions/commands/shikimori/expectedParamsRemoveSuccess');
const expectedSetNonExistLogin = require('../../../resources/actions/commands/shikimori/expectedParamsSetNonExistLogin');
const expectedSetSuccess = require('../../../resources/actions/commands/shikimori/expectedParamsSetSuccess');
let interaction;
const locale = require('../../configs/locale');
const search = require('../../../resources/actions/commands/shikimori/search');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const userDbModuleName = '../../../../main/js/db/repositories/user';
const playerModuleName = '../../../../main/js/actions/player';
const youtubeModuleName = '../../../../main/js/api/external/youtube';
const attachmentsModuleName = '../../../../main/js/utils/attachments';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const userDbMocked = jest.mock(userDbModuleName).requireMock(userDbModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);
const youtubeMocked = jest.mock(youtubeModuleName).requireMock(youtubeModuleName);
const attachmentsMocked = jest.mock(attachmentsModuleName).requireMock(attachmentsModuleName);
const axiosMocked = jest.mock('axios').requireMock('axios');
const randomOrgMocked = jest.mock('random-org').requireMock('random-org');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, play} = require('../../../../main/js/actions/commands/shikimori');

beforeAll(() => locale.init());

beforeEach(() => {
  interaction = cloneDeep(require('../../../resources/mocks/commandInteraction'));
});

describe('execute', () => {
  describe('play', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('play');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      const result = await execute(interaction);

      expect(result).toEqual({'result': 'Доступ к команде shikimori запрещен'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('shikimori', interaction);
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(commandsMocked.notify).not.toHaveBeenCalledWith();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    describe('unequal channels', () => {
      test('member connected', async () => {
        interaction.options.getSubcommand.mockReturnValueOnce('play');
        permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
        playerMocked.isConnected.mockReturnValueOnce(true);
        playerMocked.isSameChannel.mockReturnValueOnce(false);

        const result = await execute(interaction);

        expect(result).toEqual({'result': 'Не совпадают каналы'});
        expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
        expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
        expect(playerMocked.isConnected).toHaveBeenCalledWith('301783183828189184');
        expect(playerMocked.isSameChannel).toHaveBeenCalledWith('301783183828189184', '343847059612237824');
        expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('shikimori', interaction, true);
        expect(commandsMocked.notify).not.toHaveBeenCalled();
        expect(auditorMocked.audit).not.toHaveBeenCalled();
      });

      test('member not connected', async () => {
        interaction.options.getSubcommand.mockReturnValueOnce('play');
        permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
        jest.replaceProperty(interaction.member.voice, 'channelId', null);

        const result = await execute(interaction);

        expect(result).toEqual({'result': 'Не совпадают каналы'});
        expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
        expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
        expect(playerMocked.isConnected).not.toHaveBeenCalled();
        expect(playerMocked.isSameChannel).not.toHaveBeenCalled();
        expect(commandsMocked.notifyUnequalChannels).toHaveBeenCalledWith('shikimori', interaction, true);
        expect(commandsMocked.notify).not.toHaveBeenCalled();
        expect(auditorMocked.audit).not.toHaveBeenCalled();
      });
    });

    test.each([
      {count: -4},
      {count: 0},
      {count: 1000},
    ])('unbound count: $count', async ({count}) => {
      interaction.options.getSubcommand.mockReturnValueOnce('play');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      interaction.options.getInteger.mockReturnValueOnce(count);
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);

      const result = await execute(interaction);

      expect(result).toEqual({'result': 'Некорректное количество выбранных композиций'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedPlayUnboundCount);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });

    test('no random', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('play');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      interaction.options.getInteger.mockReturnValueOnce(2);
      axiosMocked.get.mockResolvedValue({data: animesJson});
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      randomOrgMocked.mockImplementationOnce(() => ({
        generateIntegers: jest.fn().mockResolvedValue({requestsLeft: 0, random: {data: [1, 4]}}),
      }));

      const result = await execute(interaction);

      expect(result).toEqual({'result': 'Рандом random.org закончился'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedPlayNoRandom);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('play');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      interaction.options.getInteger.mockReturnValueOnce(2);
      interaction.options.getString.mockReturnValueOnce('login');
      axiosMocked.get.mockResolvedValue({data: animesJson});
      playerMocked.getNowPlaying.mockReturnValue({});
      playerMocked.getSize.mockResolvedValueOnce(0);
      playerMocked.getDuration.mockResolvedValueOnce(0);
      playerMocked.hasLive.mockResolvedValueOnce(false);
      playerMocked.isConnected.mockReturnValueOnce(false);
      playerMocked.isSameChannel.mockReturnValueOnce(true);
      randomOrgMocked.mockImplementationOnce(() => ({
        generateIntegers: jest.fn().mockResolvedValue({requestsLeft: 3, random: {data: [1, 4]}}),
      }));
      youtubeMocked.getSearch.mockResolvedValueOnce(search[0]).mockResolvedValueOnce(search[1]);
      process.env.SHIKIMORI_URL = 'https://shikimori.me';

      const result = await execute(interaction);

      expect(result).toEqual({'count': 2, 'login': 'login'});
      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedPlaySearch);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(youtubeMocked.getSearch).toHaveBeenCalledTimes(2);
      expect(youtubeMocked.getSearch).toHaveBeenNthCalledWith(1, interaction, 'Steins;Gate +ending 1 +full');
      expect(youtubeMocked.getSearch).toHaveBeenNthCalledWith(2, interaction, 'Code Geass: Hangyaku no Lelouch R2 +opening 1 +full');
      expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedPlaySuccessAdded);
      expect(interaction.editReply).toHaveBeenCalledWith(expectedPlaySuccess);
      expect(playerMocked.playPlayer).toHaveBeenCalledWith(interaction);
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
      expect(userDbMocked.set).not.toHaveBeenCalled();
      expect(commandsMocked.updateCommands).not.toHaveBeenCalled();
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    test('non-existent profile shikimori', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      interaction.options.getString.mockReturnValueOnce('login');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      axiosMocked.get.mockImplementationOnce(() => {
        throw new Error('wrong user');
      });
      process.env.SHIKIMORI_URL = 'https://shikimori.me';

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(axiosMocked.get).toHaveBeenCalledWith('https://shikimori.me/login');
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSetNonExistLogin);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(userDbMocked.set).not.toHaveBeenCalled();
      expect(commandsMocked.updateCommands).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      interaction.options.getString.mockReturnValueOnce('login')
        .mockReturnValueOnce('nickname');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      axiosMocked.get.mockResolvedValue({status: 200});
      userDbMocked.set.mockReturnValueOnce();

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(axiosMocked.get).toHaveBeenCalledWith('https://shikimori.me/login');
      expect(userDbMocked.set).toHaveBeenCalledWith({'login': 'login', 'nickname': 'nickname'});
      expect(commandsMocked.updateCommands).toHaveBeenCalledWith(interaction.client);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSetSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('remove');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.remove');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('shikimori', interaction);
      expect(userDbMocked.removeByLogin).not.toHaveBeenCalled();
      expect(commandsMocked.updateCommands).not.toHaveBeenCalled();
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('remove');
      interaction.options.getString.mockReturnValueOnce('login');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      axiosMocked.get.mockResolvedValue({status: 200});
      userDbMocked.set.mockReturnValueOnce();

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.remove');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(userDbMocked.removeByLogin).toHaveBeenCalledWith('login');
      expect(commandsMocked.updateCommands).toHaveBeenCalledWith(interaction.client);
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedRemoveSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
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
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(attachmentsMocked.createShikimoriXml).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('export');
      interaction.options.getString.mockReturnValueOnce('nickname');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      attachmentsMocked.createShikimoriXml.mockResolvedValueOnce([22, 52, 66, 32]);

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.export');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(
        interaction,
        {files: [[22, 52, 66, 32]]},
      );
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(attachmentsMocked.createShikimoriXml).toHaveBeenCalledWith('nickname');
    });
  });
});

describe('play', () => {
  test('success', async () => {
    interaction.options.getSubcommand.mockReturnValueOnce('play');
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    interaction.options.getInteger.mockReturnValueOnce(2);
    interaction.options.getString.mockReturnValueOnce('login');
    axiosMocked.get.mockResolvedValue({data: animesJson});
    playerMocked.getSize.mockResolvedValueOnce(0);
    playerMocked.getDuration.mockResolvedValueOnce(0);
    playerMocked.hasLive.mockResolvedValueOnce(false);
    randomOrgMocked.mockImplementationOnce(() => ({
      generateIntegers: jest.fn().mockResolvedValue({requestsLeft: 3, random: {data: [1, 4]}}),
    }));
    youtubeMocked.getSearch.mockResolvedValueOnce(search[0]).mockResolvedValueOnce(search[1]);
    process.env.SHIKIMORI_URL = 'https://shikimori.me';

    const result = await play(interaction, false, 'login', 2);

    expect(result).toEqual({'count': 2, 'login': 'login'});
    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.shikimori.play');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandsMocked.notifyUnequalChannels).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
    expect(youtubeMocked.getSearch).toHaveBeenCalledTimes(2);
    expect(youtubeMocked.getSearch).toHaveBeenNthCalledWith(1, interaction, 'Steins;Gate +ending 1 +full');
    expect(youtubeMocked.getSearch).toHaveBeenNthCalledWith(2, interaction, 'Code Geass: Hangyaku no Lelouch R2 +opening 1 +full');
    expect(playerMocked.addAll).toHaveBeenCalledWith('301783183828189184', expectedPlaySuccessAdded);
    expect(interaction.editReply).not.toHaveBeenCalled();
    expect(playerMocked.playPlayer).toHaveBeenCalledWith(interaction);
  });
});
