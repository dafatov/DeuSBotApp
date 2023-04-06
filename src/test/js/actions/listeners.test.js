const interaction = require('../../resources/mocks/buttonInteraction');
const locale = require('../configs/locale');

const auditorModuleName = '../../../main/js/actions/auditor';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../main/js/actions/listeners');

beforeAll(() => locale.init());

describe('execute', () => {
  test('lost command', async () => {
    await execute(interaction);

    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    const listenerMocked = jest.fn();
    jest.replaceProperty(interaction.message.interaction, 'commandName', 'shikimori play');
    jest.spyOn(interaction.client.commands, 'get').mockReturnValueOnce({listener: listenerMocked});

    await execute(interaction);

    expect(listenerMocked).toHaveBeenCalledWith(interaction);
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });
});
