const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {getCommandName, toFirstUpperCase} = require('../../utils/string');
const {getFixedT, t} = require('i18next');
const {notify, notifyForbidden} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {createCalendar} = require('../../utils/attachments');
const db = require('../../db/repositories/birthday');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
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
        .setChoices(...getFixedT(null, null, 'common:time')('months', {returnObjects: true}).list
          .map((month, index) => ({name: month, value: index.toString()})))))
    .addSubcommand(s => s
      .setName('ignore')
      .setDescription(t('discord:command.birthday.ignore.description'))),
  execute: interaction => birthday(interaction),
};

const birthday = interaction => {
  switch (interaction.options.getSubcommand()) {
    case 'set':
      return set(interaction);
    case 'remove':
      return remove(interaction);
    case 'show':
      return show(interaction);
    case 'ignore':
      return ignore(interaction);
  }
};

const set = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_SET)) {
    await notifyForbidden(getCommandName(__filename), interaction);
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
    await notify(interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.birthday.wrongData'),
    });
    return;
  }

  await db.set(interaction.user.id, `${year}-${month}-${day}`);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.birthday.set.completed.title'))
    .setDescription(t('discord:command.birthday.set.completed.description', {date: tmpDate.toLocaleDateString('ru-RU')}))
    .setTimestamp();
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.birthday.set'),
  });
};

const remove = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_REMOVE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  await db.remove(interaction.user.id);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.birthday.remove.completed.title'))
    .setDescription(t('discord:command.birthday.remove.completed.description'))
    .setTimestamp();
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.birthday.removed'),
  });
};

const show = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_SHOW)) {
    await notifyForbidden(getCommandName(__filename), interaction);
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
  monthDate.setDate(monthDate.getDate() - (monthDate.getDay() === 0
    ? 7
    : monthDate.getDay()) + 1);

  const birthdays = await db.getAll().then(birthdays => birthdays
    .filter(birthday => !birthday.ignored)
    .filter(birthday => new Date(birthday.date).getMonth() === month));
  const calendar = await createCalendar(interaction.guild, birthdays, monthDate, {month, year});

  await notify(interaction, {files: [calendar]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.birthday.showed'),
  });
};

const ignore = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_IGNORE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const current = await db.ignore(interaction.user.id);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.birthday.ignore.completed.title', {username: interaction.member.displayName}))
    .setDescription(t('discord:command.birthday.ignore.completed.description', {
      not: current?.ignored ?? false
        ? 'НЕ '
        : '',
    }))
    .setTimestamp();
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.birthday.ignored'),
  });
};
