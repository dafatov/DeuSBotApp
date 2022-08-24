const {SlashCommandBuilder} = require('@discordjs/builders');
const {shuffleArray} = require('../../utils/array');
const {MessageEmbed} = require('discord.js');
const {logGuild} = require('../../utils/logger');
const {notify} = require('../commands');
const config = require('../../configs/config.js');
const {getQueue} = require('../player');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Перемешать очередь'),
  async execute(interaction) {
    await module.exports.shuffle(interaction, true);
  },
  async listener(_interaction) {},
};

module.exports.shuffle = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHUFFLE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"shuffle\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('shuffle', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде shuffle запрещен',
    });
    return {result: 'Доступ к команде запрещен'};
  }

  if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player
    || getQueue(interaction.guildId).songs.length <= 2) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Ты одинок что ли? Соло-игрок?')
      .setDescription(`${getQueue(interaction.guildId).songs.length === 0
        ? 'Пытаться перемещать то, чего нет, показывает все твое отчаяние. **Пуст плейлист. Пуст.**'
        : 'В одиночку, конечно, можно получить удовольствие, но двигать то все равно не куда. **Одна песня в плейлисте. Как ты...**'}`)
      .setTimestamp();
    if (isExecute) {
      await notify('shuffle', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[shuffle]: Пропустить композицию не вышло: плеер не играет`);
    return {result: "Плеер не играет"};
  }

  if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
    && getQueue(interaction.guildId).connection.joinConfig.channelId !==
    interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Канал не тот')
      .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
      .setTimestamp();
    if (isExecute) {
      await notify('shuffle', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[shuffle]: Пропустить композицию не вышло: не совпадают каналы`);
    return {result: "Не совпадают каналы"};
  }

  shuffleArray(getQueue(interaction.guildId).songs);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle('Плейлист ~~взболтан~~ перемешан')
    .setDescription(`Это было суровое время.. Мы мешали песни как могли, чтобы хоть как-то разнообразить свою серую жизнь..
            И  пришел он!! Генератор Псевдо Случайных Чисел или _ГПСЧ_! Он спас нас, но остался в безызвестности.. Так давайте восславим его.
            Присоединяйтесь к _культу ГПСЧ_!!! Да пребудет с Вами **Бог Псевдо Рандома**`);
  if (isExecute) {
    await notify('shuffle', interaction, {embeds: [embed]});
  }
  logGuild(interaction.guildId, `[shuffle]: Плейлист успешно перемешан`);
  return {};
}

