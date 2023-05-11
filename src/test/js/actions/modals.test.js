const interaction = require('../../resources/mocks/modalSubmitInteraction');
const locale = require('../configs/locale');

const auditorModuleName = '../../../main/js/actions/auditor';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../main/js/actions/modals');

beforeAll(() => locale.init());

describe('execute', () => {
  test('lost command', async () => {
    await execute(interaction);

    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    const modalMocked = jest.fn();
    jest.replaceProperty(interaction, 'customId', 'play');
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({modal: modalMocked});

    await execute(interaction);

    expect(modalMocked).toHaveBeenCalledWith(interaction);
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });
});
