const expectedParamsIgnoreSuccess = require('../../../resources/actions/commands/birthday/expectedParamsIgnoreSuccess');
const expectedParamsRemoveSuccess = require('../../../resources/actions/commands/birthday/expectedParamsRemoveSuccess');
const expectedParamsSetSuccess = require('../../../resources/actions/commands/birthday/expectedParamsSetSuccess');
const expectedParamsSetWrongData = require('../../../resources/actions/commands/birthday/expectedParamsSetWrongData');
const expectedParamsShowSuccess = require('../../../resources/actions/commands/birthday/expectedParamsShowSuccess');
const guild = require('../../../resources/mocks/guild');
const interaction = require('../../../resources/mocks/commandInteraction');
const locale = require('../../configs/locale');

const permissionModuleName = '../../../../main/js/db/repositories/permission';
const commandsModuleName = '../../../../main/js/actions/commands';
const auditorModuleName = '../../../../main/js/actions/auditor';
const birthdayModuleName = '../../../../main/js/db/repositories/birthday';
const attachmentsModuleName = '../../../../main/js/utils/attachments';
const permissionMocked = jest.mock(permissionModuleName).requireMock(permissionModuleName);
const commandsMocked = jest.mock(commandsModuleName).requireMock(commandsModuleName);
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const birthdayMocked = jest.mock(birthdayModuleName).requireMock(birthdayModuleName);
const attachmentsMocked = jest.mock(attachmentsModuleName).requireMock(attachmentsModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../main/js/actions/commands/birthday');

beforeAll(() => locale.init());

describe('execute', () => {
  describe('set', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.set');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('birthday', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(birthdayMocked.set).not.toHaveBeenCalled();
    });

    test.each([
      {year: 2023, month: 13, day: -4},
      {year: 2024, month: 3, day: 1},
      {year: 1880, month: 3, day: 1},
      {year: 2000, month: 13, day: 4},
    ])('wrong data: $year/$month/$day', async ({year, month, day}) => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      interaction.options.getInteger.mockReturnValueOnce(year)
        .mockReturnValueOnce(month).mockReturnValueOnce(day);

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsSetWrongData);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(birthdayMocked.set).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('set');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      interaction.options.getInteger.mockReturnValueOnce(2000)
        .mockReturnValueOnce(6).mockReturnValueOnce(13);

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.set');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsSetSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(birthdayMocked.set).toHaveBeenCalledWith('348774809003491329', '2000-6-13');
    });
  });

  describe('remove', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('remove');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.remove');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('birthday', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(birthdayMocked.remove).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('remove');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.remove');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsRemoveSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(birthdayMocked.remove).toHaveBeenCalledWith('348774809003491329');
    });
  });

  describe('show', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('show');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.show');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('birthday', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
      expect(attachmentsMocked.createCalendar).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('show');
      interaction.options.getString.mockReturnValueOnce('2');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      birthdayMocked.getAll.mockResolvedValueOnce([
        {user_id: 23, date: 'date', ignored: true},
        {user_id: '348774809003491329', date: '2000-03-13', ignored: false},
        {user_id: '548774809003491329', date: '2001-01-13', ignored: false},
      ]);
      attachmentsMocked.createCalendar.mockReturnValueOnce([24, 54, 77, 33]);

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.show');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsShowSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(attachmentsMocked.createCalendar).toHaveBeenCalledWith(guild,
        [{date: '2000-03-13', ignored: false, user_id: '348774809003491329'}],
        new Date('2023-02-27T10:20:27.013Z'), {month: 2, year: 2023},
      );
    });
  });

  describe('ignore', () => {
    test('forbidden', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('ignore');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(true));

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.ignore');
      expect(commandsMocked.notifyForbidden).toHaveBeenCalledWith('birthday', interaction);
      expect(commandsMocked.notify).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    });

    test('success', async () => {
      interaction.options.getSubcommand.mockReturnValueOnce('ignore');
      permissionMocked.isForbidden.mockImplementationOnce(() => Promise.resolve(false));
      birthdayMocked.ignore.mockResolvedValueOnce({user_id: '348774809003491329', date: '2000-03-13', ignored: true});

      await execute(interaction);

      expect(permissionMocked.isForbidden).toHaveBeenCalledWith('348774809003491329', 'command.birthday.ignore');
      expect(commandsMocked.notifyForbidden).not.toHaveBeenCalled();
      expect(commandsMocked.notify).toHaveBeenCalledWith(...expectedParamsIgnoreSuccess);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });
});
