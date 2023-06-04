const buttonInteraction = require('../../../resources/mocks/buttonInteraction');
const commandInteraction = require('../../../resources/mocks/commandInteraction');
const expectedMessages = require('../../../resources/actions/commands/statistics/expectedParamsMessages');
const expectedOnMessages = require('../../../resources/actions/commands/statistics/expectedParamsOnMessages');
const expectedOnSession = require('../../../resources/actions/commands/statistics/expectedParamsOnSession');
const expectedOnVoices = require('../../../resources/actions/commands/statistics/expectedParamsOnVoices');
const expectedSession = require('../../../resources/actions/commands/statistics/expectedParamsSession');
const expectedVoices = require('../../../resources/actions/commands/statistics/expectedParamsVoices');
const locale = require('../../configs/locale');
const sessions = require('../../../resources/actions/commands/statistics/sessions');
const statistics = require('../../../resources/actions/commands/statistics/statistics');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const sessionModuleName = '../../../../main/js/db/repositories/session';
const statisticsModuleName = '../../../../main/js/db/repositories/statistics';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const sessionMocked = jest.mock(sessionModuleName).requireMock(sessionModuleName);
const statisticsMocked = jest.mock(statisticsModuleName).requireMock(statisticsModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute, onButton} = require('../../../../main/js/actions/commands/statistics');

beforeAll(() => locale.init());

describe('execute', () => {
  describe('session', () => {
    test('forbidden', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('session');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.session');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('statistics', commandInteraction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('session');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      sessionMocked.getAll.mockResolvedValue(sessions);

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.session');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedSession);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });

  describe('messages', () => {
    test('forbidden', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('messages');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.messages');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('statistics', commandInteraction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('messages');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      statisticsMocked.getAll.mockResolvedValue(statistics);

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.messages');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedMessages);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });

  describe('voices', () => {
    test('forbidden', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('voices');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.voices');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('statistics', commandInteraction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      commandInteraction.options.getSubcommand.mockReturnValueOnce('voices');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      statisticsMocked.getAll.mockResolvedValue(statistics);

      await execute(commandInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.voices');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedVoices);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });
});

describe('onButton', () => {
  describe('session', () => {
    test('forbidden', async () => {
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));
      jest.replaceProperty(buttonInteraction, 'message', {
        interaction: {
          commandName: 'statistics session',
        },
      });

      await onButton(buttonInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.session');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('statistics', buttonInteraction);
      expect(buttonInteraction.update).not.toHaveBeenCalled();
    });

    test('success', async () => {
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      sessionMocked.getAll.mockResolvedValue(sessions);
      jest.replaceProperty(buttonInteraction, 'customId', 'update');
      jest.replaceProperty(buttonInteraction, 'message', {
        ...expectedSession[1],
        interaction: {
          commandName: 'statistics session',
        },
      });

      await onButton(buttonInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.session');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(buttonInteraction.update).toHaveBeenCalledWith(expectedOnSession);
    });
  });

  describe('messages', () => {
    test('forbidden', async () => {
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));
      jest.replaceProperty(buttonInteraction, 'message', {
        interaction: {
          commandName: 'statistics messages',
        },
      });

      await onButton(buttonInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.messages');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('statistics', buttonInteraction);
      expect(buttonInteraction.update).not.toHaveBeenCalled();
    });

    test('success', async () => {
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      statisticsMocked.getAll.mockResolvedValue(statistics);
      jest.replaceProperty(buttonInteraction, 'customId', 'next');
      jest.replaceProperty(buttonInteraction, 'message', {
        ...expectedMessages[1],
        interaction: {
          commandName: 'statistics messages',
        },
      });

      await onButton(buttonInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.messages');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(buttonInteraction.update).toHaveBeenCalledWith(expectedOnMessages);
    });
  });

  describe('voices', () => {
    test('forbidden', async () => {
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));
      jest.replaceProperty(buttonInteraction, 'message', {
        interaction: {
          commandName: 'statistics voices',
        },
      });

      await onButton(buttonInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.voices');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('statistics', buttonInteraction);
      expect(buttonInteraction.update).not.toHaveBeenCalled();
    });

    test('success', async () => {
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      statisticsMocked.getAll.mockResolvedValue(statistics);
      jest.replaceProperty(buttonInteraction, 'customId', 'last');
      jest.replaceProperty(buttonInteraction, 'message', {
        ...expectedVoices[1],
        interaction: {
          commandName: 'statistics voices',
        },
      });

      await onButton(buttonInteraction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.statistics.voices');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(buttonInteraction.update).toHaveBeenCalledWith(expectedOnVoices);
    });
  });
});
