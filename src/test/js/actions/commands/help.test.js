const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');
const successNotifyBot = require('../../../resources/actions/commands/help/expectedParamsBot');
const successNotifyHelp = require('../../../resources/actions/commands/help/expectedParamsHelp');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/actions/commands/help');

beforeAll(() => locale.init());

describe('execute', () => {
  test('forbidden', async () => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.help');
    expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('help', interaction);
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test.each([
    {option: undefined, expected: successNotifyBot},
    {option: 'help', expected: successNotifyHelp}
  ])('success: $option', async ({option, expected}) => {
    permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
    interaction.options.getString.mockReturnValueOnce(option);
    process.env.npm_package_version = '1.1.1';
    process.env.DEUS_BOT_WEB_URL = 'https://discord-bot-deus-web.onrender.com/';

    await execute(interaction);

    expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.help');
    expect(commandsMocked.notify).toHaveBeenCalledWith(...expected);
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
