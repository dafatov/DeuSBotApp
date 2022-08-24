const {SlashCommandBuilder} = require('@discordjs/builders');
const db = require('../../db/repositories/birthday');
const {MessageEmbed} = require('discord.js');
const config = require('../../configs/config');
const {notify, notifyError} = require('../commands');
const {logGuild} = require('../../utils/logger');
const {createCalendar} = require('../../utils/attachments');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Манипулирование системой дней рождений')
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Установление даты рождения')
      .addIntegerOption(i => i
        .setName('year')
        .setDescription('Год')
        .setRequired(true))
      .addIntegerOption(i => i
        .setName('month')
        .setDescription('Месяц')
        .setRequired(true))
      .addIntegerOption(i => i
        .setName('day')
        .setDescription('День')
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Удаление даты рождения'))
    .addSubcommand(s => s
      .setName('show')
      .setDescription('Отображение текущей даты рождения')
      .addStringOption(s => s
        .setName('month')
        .setDescription('Месяц')
        .setRequired(false)
        .addChoices([
          ['Январь', '0'],
          ['Февраль', '1'],
          ['Март', '2'],
          ['Апрель', '3'],
          ['Май', '4'],
          ['Июнь', '5'],
          ['Июль', '6'],
          ['Август', '7'],
          ['Сентябрь', '8'],
          ['Октябрь', '9'],
          ['Ноябрь', '10'],
          ['Декабрь', '11'],
        ])))
    .addSubcommand(s => s
      .setName('ignore')
      .setDescription('Переключить вывод уведомлений напоминающих о регистрации')),
  async execute(interaction) {
    await birthday(interaction);
  },
  async listener(_interaction) {},
}

const birthday = async (interaction) => {
  if (interaction.options.getSubcommand() === 'set') {
    await set(interaction);
  } else if (interaction.options.getSubcommand() === 'remove') {
    await remove(interaction);
  } else if (interaction.options.getSubcommand() === 'show') {
    await show(interaction);
  } else if (interaction.options.getSubcommand() === 'ignore') {
    await ignore(interaction);
  }
}

const set = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_SET)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"birthday set\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('birthday', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде birthday.set запрещен',
    });
    return;
  }

  const year = interaction.options.getInteger('year');
  const month = interaction.options.getInteger('month');
  const day = interaction.options.getInteger('day');

  const tmpDate = new Date(year, month - 1, day);
  const tmpDateStr = `${`${day}`.padStart(2, '0')}.${`${month}`.padStart(2, '0')}.${year}`;
  logGuild(interaction.guildId, `[birthday.set]: tmpDate=${tmpDate}, tmpDateStr=${tmpDateStr}`);
  if (year < 1900 || tmpDate >= new Date() || tmpDate.toLocaleDateString('ru-RU') !== tmpDateStr) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Некорректная дата рождения. Попробуй еще разочек~')
      .setDescription(
        '\"Ответы кроются в вещах, которые мы считаем естественными. Кто же ожидал, что, если соединить телефон и микроволновку, получится машина времени?\"')
      .setTimestamp()
    await notify('birthday', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[birthday]: Дата дня рождения не установлена: ошибка в синтаксисе`);
    return;
  }

  const date = `${year}-${month}-${day}`;

  try {
    await db.set(interaction.user.id, date);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Жди поздравлений...')
      .setDescription(`К качестве даты дня рождения установлен: **${tmpDate.toLocaleDateString('ru-RU')}**`)
      .setTimestamp()
    await notify('birthday', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[birthday]: Дата дня рождения успешно установлена`);
  } catch (e) {
    await notifyError('birthday', e, interaction)
  }
}

const remove = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"birthday remove\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('birthday', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде birthday.remove запрещен',
    });
    return;
  }

  try {
    await db.delete(interaction.user.id);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Больше не жди поздравлений')
      .setDescription('Дата дня рождения удалена')
      .setTimestamp();
    await notify('birthday', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[birthday]: Дата дня рождения успешно удалена`);
  } catch (e) {
    await notifyError('birthday', e, interaction)
  }
}

const show = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_SHOW)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"birthday show\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('birthday', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде birthday.show запрещен',
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
  await interaction.deferReply();
  const calendar = await createCalendar(interaction.guild, birthdays, monthDate, {month, year});
  try {
    await interaction.editReply({files: [calendar]});
    logGuild(interaction.guildId, `[birthday]: Календарь дней рождений успешно выведен`);
  } catch (e) {
    await notifyError('birthday', e, interaction);
  }
}

const ignore = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_BIRTHDAY_IGNORE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"birthday ignore\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('birthday', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде birthday.ignore запрещен',
    });
    return;
  }

  try {
    const current = (await db.get(interaction.user.id))[0];
    await db.ignore(interaction.user.id, !(current?.ignored ?? false));
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(`Пользователь ${interaction.user.username}...`)
      .setDescription(`...решил ${(!(current?.ignored ?? false))
        ? ''
        : 'НЕ'} игнорировать все напоминания о дате рождения`)
      .setTimestamp();
    await notify('birthday', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[birthday]: Состояние уведомлений о регистрации дня рождения успешно установлена`);
  } catch (e) {
    await notifyError('birthday', e, interaction)
  }
}
