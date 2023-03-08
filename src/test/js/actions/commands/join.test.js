const {VoiceConnectionStatus} = require('@discordjs/voice');
const {cloneDeep} = require('lodash');
const expectedSuccess = require('../../../resources/actions/commands/join/expectedParamsSuccess');
const expectedWrongChannel = require('../../../resources/actions/commands/join/expectedParamsWrongChannel');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const playerModuleName = '../../../../main/js/actions/player';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const playerMocked = jest.mock(playerModuleName).requireMock(playerModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, join} = require('../../../../main/js/actions/commands/join');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.join');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('join', interaction);
    expect(playerMocked.createConnection).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditMocked.audit).not.toHaveBeenCalled();
  });

  test('already connected', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValueOnce({
      connection: {_state: {status: VoiceConnectionStatus.Connecting}},
    });

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.join');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.createConnection).not.toHaveBeenCalled();
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditMocked.audit).not.toHaveBeenCalled();
  });

  test('wrong voice channel', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValueOnce(undefined);
    const clonedInteraction = cloneDeep(interaction);
    clonedInteraction.member.voice = {...clonedInteraction.member.voice, channel: null};

    await execute(clonedInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.join');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.createConnection).not.toHaveBeenCalled();
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedWrongChannel(clonedInteraction));
    expect(auditMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValueOnce(undefined);

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.join');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.createConnection).toHaveBeenCalledWith(interaction, interaction.member.voice.channel);
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSuccess);
    expect(auditMocked.audit).toHaveBeenCalled();
  });
});

describe('join', () => {
  test('is not execute', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    playerMocked.getQueue.mockReturnValueOnce(undefined);

    await join(interaction, false);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.join');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(playerMocked.createConnection).toHaveBeenCalledWith(interaction, interaction.member.voice.channel);
    expect(commandsMocked.notify).not.toHaveBeenCalled();
    expect(auditMocked.audit).toHaveBeenCalled();
  });
});
