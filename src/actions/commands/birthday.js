const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {getFixedT, t} = require('i18next');
const {notify, notifyError} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {createCalendar} = require('../../utils/attachments');
const db = require('../../db/repositories/birthday');
const {toFirstUpperCase} = require('../../utils/string');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription(t('discord:command.birthday.description'))
    .addSubcommand(s => s
      .setName('set')
      .setDescription(t('discord:command.birthday.set.description'))
      .addIntegerOption(i => i
        .setName('year')
        .setDescription(toFirstUpperCase(t('common:time.years.name.1')))
        .setRequired(true))
      .addIntegerOption(i => i
        .setName('month')
        .setDescription(toFirstUpperCase(t('common:time.months.name.1')))
        .setRequired(true))
      .addIntegerOption(i => i
        .setName('day')
        .setDescription(toFirstUpperCase(t('common:time.days.name.1')))
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription(t('discord:command.birthday.remove.description')))
    .addSubcommand(s => s
      .setName('show')
      .setDescription(t('discord:command.birthday.show.description'))
      .addStringOption(s => s
        .setName('month')
        .setDescription(toFirstUpperCase(t('common:time.months.name.1')))
        .setRequired(false)
        .addChoices(getFixedT(null, null, 'common:time')('months', {returnObjects: true}).list.map((month, index) => [month, index.toString()]))))
    .addSubcommand(s => s
      .setName('ignore')
      .setDescription(t('discord:command.birthday.ignore.description'))),
  async execute(interaction) {
    await birthday(interaction);
  },
};

const birthday = async interaction => {
  if (interaction.options.getSubcommand() === 'set') {
    await set(interaction);
  } else if (interaction.options.getSubcommand() === 'remove') {
    await remove(interaction);
  } else if (interaction.options.getSubcommand() === 'show') {
    await show(interaction);
  } else if (interaction.options.getSubcommand() === 'ignore') {
    await ignore(interaction);
  }
};

const set = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_SET)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'birthday set'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('birthday', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'birthday.set'}),
    });
    return;
  }

  const year = interaction.options.getInteger('year');
  const month = interaction.options.getInteger('month');
  const day = interaction.options.getInteger('day');

  const tmpDate = new Date(year, month - 1, day);
  const tmpDateStr = `${`${day}`.padStart(2, '0')}.${`${month}`.padStart(2, '0')}.${year}`;

  if (year < 1900 || tmpDate >= new Date() || tmpDate.toLocaleDateString('ru-RU') !== tmpDateStr) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.birthday.set.wrongData.title'))
      .setDescription(t('discord:command.birthday.set.wrongData.description'))
      .setTimestamp();
    await notify('birthday', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.birthday.wrongData'),
    });
    return;
  }

  const date = `${year}-${month}-${day}`;

  try {
    await db.set(interaction.user.id, date);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.birthday.set.completed.title'))
      .setDescription(t('discord:command.birthday.set.completed.description', {date: tmpDate.toLocaleDateString('ru-RU')}))
      .setTimestamp();
    await notify('birthday', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.birthday.set'),
    });
  } catch (e) {
    await notifyError('birthday', e, interaction);
  }
};

const remove = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'birthday remove'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('birthday', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'birthday.remove'}),
    });
    return;
  }

  try {
    await db.remove(interaction.user.id);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.birthday.remove.completed.title'))
      .setDescription(t('discord:command.birthday.remove.completed.description'))
      .setTimestamp();
    await notify('birthday', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.birthday.removed'),
    });
  } catch (e) {
    await notifyError('birthday', e, interaction);
  }
};

const show = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_SHOW)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'birthday show'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('birthday', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'birthday.show'}),
    });
    return;
  }

  const monthDate = new Date();
  const month = parseInt(interaction.options.getString('month') ?? monthDate.getMonth());
  const year = month < monthDate.getMonth()
    ? monthDate.getFullYear() + 1
    : monthDate.getFullYear();

  monthDate.setDate(1);
  monthDate.setFullYear(year);
  monthDate.setMonth(month);

  const birthdays = (await db.getAll())
    .filter(b => !b.ignored)
    .filter(b => new Date(b.date).getMonth() === monthDate.getMonth());

  monthDate.setDate(monthDate.getDate() - (monthDate.getDay() === 0
    ? 7
    : monthDate.getDay()) + 1);
  const calendar = await createCalendar(interaction.guild, birthdays, monthDate, {month, year});
  try {
    await notify('birthday', interaction, {files: [calendar]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.birthday.showed'),
    });
  } catch (e) {
    await notifyError('birthday', e, interaction);
  }
};

const ignore = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_IGNORE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'birthday ignore'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('birthday', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'birthday.ignore'}),
    });
    return;
  }

  try {
    const current = (await db.get(interaction.user.id))[0];
    await db.ignore(interaction.user.id, !(current?.ignored ?? false));
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.birthday.ignore.completed.title', {username: interaction.user.username}))
      .setDescription(t('discord:command.birthday.ignore.completed.description', {
        expr: current?.ignored ?? false
          ? 'НЕ'
          : '',
      }))
      .setTimestamp();
    await notify('birthday', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.birthday.ignored'),
    });
  } catch (e) {
    await notifyError('birthday', e, interaction);
  }
};
