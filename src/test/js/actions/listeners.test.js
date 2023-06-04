const interaction = require('../../resources/mocks/buttonInteraction');
const locale = require('../configs/locale');

const auditorModuleName = '../../../main/js/actions/auditor';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {onButton, onSelect, onModal} = require('../../../main/js/actions/listeners');

beforeAll(() => locale.init());

describe('onButton', () => {
  test('lost command', async () => {
    await onButton(interaction);

    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    const onButtonMocked = jest.fn();
    jest.replaceProperty(interaction.message.interaction, 'commandName', 'shikimori play');
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({onButton: onButtonMocked});

    await onButton(interaction);

    expect(onButtonMocked).toHaveBeenCalledWith(interaction);
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });
});

describe('onModal', () => {
  test('lost command', async () => {
    await onModal(interaction);

    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    const onModalMocked = jest.fn();
    jest.replaceProperty(interaction, 'customId', 'play');
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({onModal: onModalMocked});

    await onModal(interaction);

    expect(onModalMocked).toHaveBeenCalledWith(interaction);
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });
});

describe('onSelect', () => {
  test('lost command', async () => {
    await onSelect(interaction);

    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    const onSelectMocked = jest.fn();
    jest.replaceProperty(interaction.message.interaction, 'commandName', 'shikimori play');
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({onSelect: onSelectMocked});

    await onSelect(interaction);

    expect(onSelectMocked).toHaveBeenCalledWith(interaction);
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });
});
