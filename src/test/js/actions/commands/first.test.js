const interaction = require('../../../resources/mocks/commandInteraction');

const moveModuleName = '../../../../main/js/actions/commands/move';
const moveMocked = jest.mock(moveModuleName).requireMock(moveModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/actions/commands/first');

describe('execute', () => {
  test('success', async () => {
    moveMocked.move.mockResolvedValueOnce({isMoved: {}, newIndex: 2});

    const result = await execute(interaction);

    expect(result).toEqual({'isMoved': {}, 'newIndex': 2});
    expect(moveMocked.move).toHaveBeenCalledWith(interaction, true, 0);
  });
});
