const {SlashCommandBuilder} = require('discord.js');
const client = require('../../resources/mocks/client');
const expectedCommands = require('../../resources/actions/commands/expectedCommands');
const expectedCommandsData = require('../../resources/actions/commands/expectedCommandsData');
const expectedParamsNotifyError = require('../../resources/actions/commands/expectedParamsNotifyError');
const expectedParamsNotifyForbidden = require('../../resources/actions/commands/expectedParamsNotifyForbidden');
const expectedParamsNotifyIsLive = require('../../resources/actions/commands/expectedParamsNotifyIsLive');
const expectedParamsNotifyNoPlaying = require('../../resources/actions/commands/expectedParamsNotifyNoPlaying');
const expectedParamsNotifyRestricted = require('../../resources/actions/commands/expectedParamsNotifyRestricted');
const expectedParamsNotifyUnbound = require('../../resources/actions/commands/expectedParamsNotifyUnbound');
const expectedParamsNotifyUnequalChannels = require('../../resources/actions/commands/expectedParamsNotifyUnequalChannels');
const interaction = require('../../resources/mocks/commandInteraction');
const locale = require('../configs/locale');
const radios = require('../../resources/actions/commands/radios');

const auditorModuleName = '../../../main/js/actions/auditor';
const playerModuleName = '../../../main/js/actions/player';
const userDbModuleName = '../../../main/js/db/repositories/user';
const radiosModuleName = '../../../main/js/actions/radios';
const constantsModuleName = '../../../main/js/utils/constants';
const fsMocked = jest.mock('fs').requireMock('fs');
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);
const userDbMocked = jest.mock(userDbModuleName).requireMock(userDbModuleName);
const radiosMocked = jest.mock(radiosModuleName).requireMock(radiosModuleName);
const constantsMocked = jest.mock(constantsModuleName).requireMock(constantsModuleName);
const discordMocked = jest.mock('discord.js', () => ({
  ...jest.requireActual('discord.js'),
  REST: jest.fn(),
})).requireMock('discord.js');

// eslint-disable-next-line sort-imports-requires/sort-requires
const commands = require('../../../main/js/actions/commands');

beforeAll(() => locale.init());

afterEach(() => client.commands.clear());

describe('init', () => {
  test('success', async () => {
    process.env.RESTORABLE_TABLES = '["queue"]';
    const fsMockImplementation = args =>
      jest.requireActual('fs').readdirSync(args);
    jest.spyOn(commands, 'updateCommands').mockReturnValueOnce();
    fsMocked.readdirSync.mockImplementationOnce(fsMockImplementation)
      .mockImplementationOnce(fsMockImplementation);
    userDbMocked.getAll.mockResolvedValue([
      {login: 'login1', nickname: 'nickname1'},
      {login: 'login2', nickname: 'nickname2'},
    ]);
    radiosMocked.getRadios.mockResolvedValueOnce(radios);
    jest.replaceProperty(constantsMocked, 'DISCORD_OPTIONS_MAX', 2);

    await commands.init(client);

    expect(await commands.getCommandsData(client)).toEqual(expectedCommands);
    expect(commands.updateCommands).toHaveBeenCalledWith(client);
  });

  test.each([
    {dir: [], expected: []},
    {dir: ['_ping'], expected: []},
    {dir: ['test.jsx'], expected: []},
    {dir: ['_from.js'], expected: []},
  ])('empty: $dir', async ({dir, expected}) => {
    fsMocked.readdirSync.mockImplementationOnce(() => dir);

    await commands.init(client);

    expect(client.commands.map(command => command.data.toJSON()))
      .toEqual(expected);
    expect(commands.updateCommands).not.toHaveBeenCalled();
  });
});

describe('updateCommands', () => {
  test('success', async () => {
    client.commands.set('test', {
      data: () => new SlashCommandBuilder()
        .setName('test')
        .setDescription('test description'),
    });
    const putMocked = jest.fn()
      .mockResolvedValueOnce([{guild_id: '301783183828189184'}])
      .mockResolvedValueOnce([{guild_id: '905052154027475004'}]);
    discordMocked.REST.mockImplementationOnce(() => ({
      put: putMocked,
      setToken: jest.fn().mockReturnThis(),
    }));

    await commands.updateCommands(client);

    expect(putMocked).toHaveBeenNthCalledWith(1,
      '/applications/348774809003491329/guilds/301783183828189184/commands', expectedCommandsData,
    );
    expect(putMocked).toHaveBeenNthCalledWith(2,
      '/applications/348774809003491329/guilds/905052154027475004/commands', expectedCommandsData,
    );
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('execute', () => {
  test('success', async () => {
    const executeMocked = jest.fn();
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({execute: executeMocked});

    await commands.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(executeMocked).toHaveBeenCalledWith(interaction);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('without defer reply', async () => {
    const executeMocked = jest.fn();
    const isDeferReplyMocked = jest.fn().mockReturnValueOnce(false);
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({
      execute: executeMocked, isDeferReply: isDeferReplyMocked,
    });

    await commands.execute(interaction);

    expect(interaction.deferReply).not.toHaveBeenCalled();
    expect(isDeferReplyMocked).toHaveBeenCalledWith(interaction);
    expect(executeMocked).toHaveBeenCalledWith(interaction);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('restricted', async () => {
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({execute: jest.fn()});
    jest.spyOn(commands, 'notifyRestricted').mockReturnValueOnce();
    process.env.RESTRICTED_COMMANDS = '["play"]';
    jest.replaceProperty(interaction, 'commandName', 'play');

    await commands.execute(interaction);

    expect(interaction.deferReply).not.toHaveBeenCalled();
    expect(commands.notifyRestricted).toHaveBeenCalledWith('play', interaction);
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {command: undefined},
    {command: {}},
    {command: {execute: {}}},
  ])('no command: $command', async ({command}) => {
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce(command);

    await commands.execute(interaction);

    expect(interaction.deferReply).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('error', async () => {
    const executeMocked = jest.fn().mockRejectedValueOnce();
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({execute: executeMocked});
    jest.spyOn(commands, 'notify').mockReturnValueOnce();
    auditorMocked.audit.mockResolvedValueOnce({id: '123'});
    jest.replaceProperty(interaction, 'commandName', 'clear');

    await commands.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(executeMocked).toHaveBeenCalledWith(interaction);
    expect(auditorMocked.audit).toHaveBeenCalled();
    expect(commands.notify).toHaveBeenCalledWith(...expectedParamsNotifyError);
  });
});

describe('notify', () => {
  test('reply', async () => {
    jest.replaceProperty(interaction, 'deferred', false);
    jest.replaceProperty(interaction, 'replied', false);
    interaction.isRepliable.mockReturnValueOnce(true);

    await commands.notify(interaction, {embeds: []});

    expect(interaction.reply).toHaveBeenCalledWith({embeds: []});
    expect(interaction.followUp).not.toHaveBeenCalled();
    expect(interaction.editReply).not.toHaveBeenCalled();
  });

  test('editReply', async () => {
    jest.replaceProperty(interaction, 'deferred', true);
    jest.replaceProperty(interaction, 'replied', false);
    interaction.isRepliable.mockReturnValueOnce(true);

    await commands.notify(interaction, {embeds: []});

    expect(interaction.reply).not.toHaveBeenCalled();
    expect(interaction.followUp).not.toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({embeds: []});
  });

  test.each([
    {deferred: false, replied: false, isRepliable: false},
    {deferred: true, replied: false, isRepliable: false},
    {deferred: false, replied: true, isRepliable: false},
    {deferred: true, replied: true, isRepliable: false},
    {deferred: false, replied: true, isRepliable: true},
    {deferred: true, replied: true, isRepliable: true},
  ])(
    'followUp: {deferred: $deferred, replied: $replied, isRepliable: $isRepliable}',
    async ({deferred, replied, isRepliable}) => {
      jest.replaceProperty(interaction, 'deferred', deferred);
      jest.replaceProperty(interaction, 'replied', replied);
      interaction.isRepliable.mockReturnValueOnce(isRepliable);

      await commands.notify(interaction, {embeds: []});

      expect(interaction.reply).not.toHaveBeenCalled();
      expect(interaction.followUp).toHaveBeenCalledWith({embeds: []});
      expect(interaction.editReply).not.toHaveBeenCalled();
    },
  );
});

describe('notifyForbidden', () => {
  test('success', async () => {
    jest.spyOn(commands, 'notify').mockReturnValueOnce();

    await commands.notifyForbidden('test', interaction);

    expect(commands.notify).toHaveBeenCalledWith(...expectedParamsNotifyForbidden);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('notifyRestricted', () => {
  test('success', async () => {
    jest.spyOn(commands, 'notify').mockReturnValueOnce();

    await commands.notifyRestricted('test', interaction);

    expect(commands.notify).toHaveBeenCalledWith(...expectedParamsNotifyRestricted);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('notifyNoPlaying', () => {
  test('not execute', async () => {
    await commands.notifyNoPlaying('test', interaction, false);

    expect(commands.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    jest.spyOn(commands, 'notify').mockReturnValueOnce();

    await commands.notifyNoPlaying('test', interaction);

    expect(commands.notify).toHaveBeenCalledWith(...expectedParamsNotifyNoPlaying);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('notifyUnequalChannels', () => {
  test('not execute', async () => {
    await commands.notifyUnequalChannels('test', interaction, false);

    expect(commands.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    jest.spyOn(commands, 'notify').mockReturnValueOnce();

    await commands.notifyUnequalChannels('test', interaction, true);

    expect(commands.notify).toHaveBeenCalledWith(...expectedParamsNotifyUnequalChannels);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('notifyIsLive', () => {
  test('not execute', async () => {
    await commands.notifyIsLive('test', interaction, false);

    expect(commands.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    jest.spyOn(commands, 'notify').mockReturnValueOnce();

    await commands.notifyIsLive('test', interaction, true);

    expect(commands.notify).toHaveBeenCalledWith(...expectedParamsNotifyIsLive);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('notifyUnbound', () => {
  test('not execute', async () => {
    await commands.notifyUnbound('test', interaction, false);

    expect(commands.notify).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    playerMocked.getSize.mockResolvedValueOnce(2);
    jest.spyOn(commands, 'notify').mockReturnValueOnce();

    await commands.notifyUnbound('test', interaction, true);

    expect(commands.notify).toHaveBeenCalledWith(...expectedParamsNotifyUnbound);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
