const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {logGuild} = require('../../utils/logger');
const {notify} = require('../commands');
const config = require('../../configs/config.js');
const {escaping} = require('../../utils/string');
const {arrayMoveMutable} = require('../../utils/array.js');
const {getQueue} = require('../player');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Переместить композицию с места в очереди на другое')
    .addIntegerOption(o => o
      .setName('target')
      .setDescription('Номер в очереди целевой композиции')
      .setRequired(true))
    .addIntegerOption(o => o
      .setName('position')
      .setDescription('Номер конечной позиции целевой композиции')
      .setRequired(true)),
  async execute(interaction) {
    await module.exports.move(interaction, true);
  },
  async listener(_interaction) {},
}

module.exports.move = async (interaction, isExecute, positionIndex = interaction.options.getInteger("position") - 1,
  targetIndex = interaction.options.getInteger("target") - 1
) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_MOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"move\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('move', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде move запрещен',
    });
    return {result: 'Доступ к команде запрещен'};
  }

  if (!getQueue(interaction.guildId).songs || getQueue(interaction.guildId).songs.length < 2) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Ты одинок что ли? Соло-игрок?')
      .setDescription(`${getQueue(interaction.guildId).songs.length === 0
        ? 'Пытаться перемещать то, чего нет, показывает все твое отчаяние. **Пуст плейлист. Пуст.**'
        : 'В одиночку, конечно, можно получить удовольствие, но двигать то все равно не куда. **Одна песня в плейлисте. Как ты...**'}`)
      .setTimestamp();
    if (isExecute) {
      await notify('move', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[move]: Переместить композицию не вышло: плеер не играет`);
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
      await notify('move', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[move]: Переместить композицию не вышло: не совпадают каналы`);
    return {result: "Не совпадают каналы"};
  }

  if (targetIndex < 0 || targetIndex + 1 > getQueue(interaction.guildId).songs.length
    || positionIndex < 0 || positionIndex + 1 > getQueue(interaction.guildId).songs.length) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Ты это.. Вселенной ошибся, чел.')
      .setDescription(`Типа знаешь вселенная расширяется, а твой мозг походу нет. Ну вышел ты за пределы размеров очереди.
                    Диапазон значений _от 1 до ${getQueue(interaction.guildId).songs.length}_`)
      .setTimestamp();
    if (isExecute) {
      await notify('move', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[move]: Переместить композицию не вышло: выход за пределы очереди`);
    return {result: "Выход за пределы очереди"};
  }

  const target = getQueue(interaction.guildId).songs[targetIndex];

  arrayMoveMutable(getQueue(interaction.guildId).songs, targetIndex, positionIndex);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle('Целевая композиция передвинута')
    .setDescription(`Композиция **${escaping(target.title)}** протолкала всех локтями на позицию **${positionIndex + 1}**.
            Кто бы сомневался. Донатеры ${escaping('****')}ые`);
  if (isExecute) {
    await notify('move', interaction, {embeds: [embed]});
  }
  logGuild(interaction.guildId, `[move]: Композиция была успешна перемещена`);
  return {isMoved: target, newIndex: positionIndex};
}
