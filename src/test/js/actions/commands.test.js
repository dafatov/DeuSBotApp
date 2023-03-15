const client = require('../../resources/mocks/client');
const expectedCommands = require('../../resources/actions/expectedCommands');
const interaction = require('../../resources/mocks/commandInteraction');
const locale = require('../configs/locale');

const auditorModuleName = '../../../main/js/actions/auditor';
const usersDbModuleName = '../../../main/js/db/repositories/users';
const fsMocked = jest.mock('fs').requireMock('fs');
const auditMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const usersDbMocked = jest.mock(usersDbModuleName).requireMock(usersDbModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const commands = require('../../../main/js/actions/commands');

beforeAll(() => locale.init());

describe('init', () => {
  test('success', async () => {
    jest.spyOn(commands, 'updateCommands').mockReturnValueOnce();
    fsMocked.readdirSync.mockImplementationOnce(args =>
      jest.requireActual('fs').readdirSync(args));
    usersDbMocked.getAll.mockResolvedValue([
      {login: 'login1', nickname: 'nickname1'},
      {login: 'login2', nickname: 'nickname2'},
    ]);

    await commands.init(client);

    expect(await Promise.all(client.commands.map(command => commands.getCommandData(command)
      .then(commandData => commandData.toJSON()))))
      .toEqual(expectedCommands);
    expect(commands.updateCommands).toHaveBeenCalledWith(client);
  });

  test.each([
    {dir: [], expected: []},
    {dir: ['_ping'], expected: []},
    {dir: ['test.jsx'], expected: []},
    {dir: ['_from.js'], expected: []},
  ])('empty: $dir', async ({dir, expected}) => {
    jest.spyOn(commands, 'updateCommands').mockReturnValueOnce();
    fsMocked.readdirSync.mockImplementationOnce(() => dir);

    await commands.init(client);

    expect(client.commands.map(command => command.data.toJSON()))
      .toEqual(expected);
    expect(commands.updateCommands).not.toHaveBeenCalled();
  });
});

describe('execute', () => {
  test('success', async () => {
    const executeMocked = jest.fn();
    interaction.client.commands = {
      get: jest.fn().mockReturnValueOnce({execute: executeMocked}),
    };

    await commands.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(executeMocked).toHaveBeenCalledWith(interaction);
    expect(auditMocked.audit).toHaveBeenCalled();
  });

  test('restricted', async () => {
    interaction.client.commands = {
      get: jest.fn().mockReturnValueOnce({execute: jest.fn()}),
    };
    jest.spyOn(commands, 'notifyRestricted').mockReturnValueOnce();
    process.env.RESTRICTED_COMMANDS = '["play"]';

    await commands.execute(interaction);

    expect(interaction.deferReply).not.toHaveBeenCalled();
    expect(commands.notifyRestricted).toHaveBeenCalledWith('play', interaction);
    expect(auditMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {command: undefined},
    {command: {}},
    {command: {execute: {}}},
  ])('failure: $command', async ({command}) => {
    interaction.client.commands = {
      get: jest.fn().mockReturnValueOnce(command),
    };

    await commands.execute(interaction);

    expect(interaction.deferReply).not.toHaveBeenCalled();
    expect(auditMocked.audit).not.toHaveBeenCalled();
  });
});
