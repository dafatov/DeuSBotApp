const {SlashCommandBuilder} = require("@discordjs/builders");
const db = require("../../repositories/birthday");
const {MessageEmbed} = require("discord.js");
const config = require("../../configs/config");
const {notify, notifyError} = require("../commands");
const {logGuild} = require("../../utils/logger");
const {parseStr} = require("../../utils/dateTime");

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
      .setDescription('Отображение текущей даты рождения'))
    .addSubcommand(s => s
      .setName('ignore')
      .setDescription('Переключить выводв уведомлений напоминающих о регистрации')),
  async execute(interaction) {
    await birthday(interaction);
  },
  async listener(interaction) {}
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
      .setDescription(`К качестве даты дня рождения устновлен: **${tmpDate.toLocaleDateString('ru-RU')}**`)
      .setTimestamp()
    await notify('birthday', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[birthday]: Дата дня рождения успешно установлена`);
  } catch (e) {
    await notifyError('birthday', e, interaction)
  }
}

const remove = async (interaction) => {
  try {
    await db.delete(interaction.user.id);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Больше не жди поздравлений')
      .setDescription('Дата дня рождения удалена')
      .setTimestamp()
    await notify('birthday', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[birthday]: Дата дня рождения успешно удалена`);
  } catch (e) {
    await notifyError('birthday', e, interaction)
  }
}

const show = async (interaction) => {
  try {
    const current = (await db.get(interaction.user.id))[0];
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(`Для пользователя ${interaction.user.username}...`)
      .setDescription(`...установлена дата дня рождения на **${parseStr(current?.date) ?? '...ничего. Не установлена короче'}**`)
      .setTimestamp()
    await notify('birthday', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[birthday]: Дата дня рождения успешно выведена`);
  } catch (e) {
    await notifyError('birthday', e, interaction)
  }
}

const ignore = async (interaction) => {
  try {
    const current = (await db.get(interaction.user.id))[0];
    await db.ignore(interaction.user.id, !(current?.ignored ?? false));
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(`Пользователь ${interaction.user.username}...`)
      .setDescription(`...решил ${(!(current?.ignored ?? false)) ? '' : 'НЕ'} игнорировать все напоминания о дате рождения`)
      .setTimestamp()
    await notify('birthday', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[birthday]: Состояние уведомлений о регистрации дня рождения успешно установлена`);
  } catch (e) {
    await notifyError('birthday', e, interaction)
  }
}