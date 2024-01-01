const buttonInteraction = require('../../../resources/mocks/buttonInteraction');
const commandInteraction = require('../../../resources/mocks/commandInteraction');
const expectModal = require('../../../resources/actions/commands/questionnaire/expectModal');
const expectParamsChosen = require('../../../resources/actions/commands/questionnaire/expectParamsChosen');
const expectParamsCompleted = require('../../../resources/actions/commands/questionnaire/expectParamsCompleted');
const expectParamsStarted = require('../../../resources/actions/commands/questionnaire/expectParamsStarted');
const expectParamsStartedEdited = require('../../../resources/actions/commands/questionnaire/expectParamsStartedEdited');
const interactionCollector = require('../../../resources/mocks/interactionCollector');
const interactionResponsesByUser = require('../../../resources/actions/commands/questionnaire/interactionResponsesByUser');
const jestConfig = require('../../../../../jest.config');
const locale = require('../../configs/locale');
const message = require('../../../resources/mocks/message');
const modalSubmitInteraction = require('../../../resources/mocks/modalSubmitInteraction');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const questionnaire = require('../../../../main/js/actions/commands/questionnaire');

beforeAll(() => locale.init());

describe('isDeferReply', () => {
  test('success', () => {
    const result = questionnaire.isDeferReply();

    expect(result).toBeFalsy();
  });
});

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await questionnaire.execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.questionnaire');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('questionnaire', commandInteraction);
    expect(commandInteraction.showModal).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('success', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    commandInteraction.options.getString.mockReturnValueOnce('title title title');
    commandInteraction.options.getInteger.mockReturnValueOnce(2);

    await questionnaire.execute(commandInteraction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.questionnaire');
    expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
    expect(commandInteraction.showModal).toHaveBeenCalledWith(expectModal);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('onModal', () => {
  test('success', () => new Promise(done => {
    const onAfterCollectorEndFunction = () => {};
    jest.replaceProperty(modalSubmitInteraction.fields, 'fields', [
      {value: 'value_1'}, {value: 'value_2 '}, {value: ''}, {value: ' '}, {value: 'value_3'},
    ]);
    jest.replaceProperty(modalSubmitInteraction, 'customId', 'questionnaire 2\ntitle_title_title');
    jest.useFakeTimers({doNotFake: []});
    jest.spyOn(global, 'setInterval');
    jest.spyOn(questionnaire, 'onAfterCollectorEnd').mockReturnValueOnce(onAfterCollectorEndFunction);
    commandsMocked.notify.mockResolvedValueOnce(message);

    questionnaire.onModal(modalSubmitInteraction)
      .then(() => {
        expect(modalSubmitInteraction.deferReply).toHaveBeenCalled();
        expect(commandsMocked.notify).toHaveBeenCalledWith(...expectParamsStarted);
        expect(auditorMocked.audit).toHaveBeenCalled();
        expect(message.createMessageComponentCollector).toHaveBeenCalledWith({componentType: 2, time: 120000});
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
        expect(message.edit).not.toHaveBeenCalled();
        expect(questionnaire.onAfterCollectorEnd).toHaveBeenCalledWith(message, {}, interactionCollector, '301783183828189184', expect.any(Object));
        expect(interactionCollector.on).toHaveBeenCalledWith('collect', expect.any(Function));
        expect(interactionCollector.once).toHaveBeenCalledWith('end', expect.any(Function));
      }).then(() => jest.runOnlyPendingTimers())
      .then(() => expect(message.edit).toHaveBeenCalledWith(...expectParamsStartedEdited))
      .then(() => {
        jest.setSystemTime(jestConfig.fakeTimers.now);
        done();
      });
  }));
});

describe('onCollectorCollect', () => {
  test('success', () => {
    const result = questionnaire.onCollectorCollect([], {});

    expect(result).toEqual(expect.any(Function));
  });

  describe('on', () => {
    test('success', async () => {
      const deleteFunction = jest.fn();
      const interactionResponsesByUser = {[buttonInteraction.user.id]: {delete: deleteFunction}};
      jest.replaceProperty(buttonInteraction, 'customId', 'optionButton_1');
      buttonInteraction.reply.mockResolvedValueOnce({});

      await questionnaire.onCollectorCollect(['option0', 'option1', 'option2'], interactionResponsesByUser)(buttonInteraction);

      expect(interactionResponsesByUser).toEqual({'348774809003491329': {}});
      expect(deleteFunction).toHaveBeenCalled();
      expect(buttonInteraction.reply).toHaveBeenCalledWith(...expectParamsChosen);
    });
  });
});

describe('onCollectorEnd', () => {
  test('success', () => {
    const result = questionnaire.onCollectorEnd({}, [], '', () => {});

    expect(result).toEqual(expect.any(Function));
  });

  describe('once', () => {
    test('success', async () => {
      const onAfterCollectorEnd = jest.fn();
      const options = ['optionButton_0', 'optionButton_1', 'optionButton_2'];

      await questionnaire.onCollectorEnd(interactionResponsesByUser, options, 'title', onAfterCollectorEnd)({}, 'time');

      expect(onAfterCollectorEnd).toHaveBeenCalledWith(...expectParamsCompleted);
    });
  });
});

describe('onAfterCollectorEnd', () => {
  test('success', () => {
    const result = questionnaire.onAfterCollectorEnd({}, {}, {}, '', '');

    expect(result).toEqual(expect.any(Function));
  });

  describe('on', () => {
    test('success', async () => {
      const deleteFunction = jest.fn();
      const interactionResponsesByUser = {'0': {delete: deleteFunction}, '1': {delete: deleteFunction}};
      jest.spyOn(global, 'clearInterval');

      await questionnaire.onAfterCollectorEnd(message, interactionResponsesByUser, interactionCollector, modalSubmitInteraction.guildId, '1')(
        ...expectParamsCompleted);

      expect(clearInterval).toHaveBeenCalledWith('1');
      expect(message.edit).toHaveBeenCalledWith(expectParamsCompleted[0]);
      expect(deleteFunction).toHaveBeenCalledTimes(2);
      expect(interactionCollector.removeAllListeners).toHaveBeenCalledWith('collect');
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });
});

describe('onButton', () => {
  test('success', () => {
    questionnaire.onButton(buttonInteraction);

    expect(buttonInteraction.update).not.toHaveBeenCalled();
  });
});
