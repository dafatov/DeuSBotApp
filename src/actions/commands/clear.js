const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {logGuild} = require('../../utils/logger');
const {notify} = require('../commands');
const config = require('../../configs/config.js');
const {getQueue, clearQueue} = require('../player');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Очистить очередь'),
  async execute(interaction) {
    await module.exports.clear(interaction, true);
  },
  async listener(_interaction) {},
};

module.exports.clear = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_CLEAR)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"clear\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('clear', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде clear запрещен',
    });
    return {result: 'Доступ к команде запрещен'};
  }

  if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player
    || getQueue(interaction.guildId).songs.length === 0) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Так ничего и не играло')
      .setDescription(`Как ты жалок... Зачем очищать, то чего нет? Или у тебя голоса в голове?`)
      .setTimestamp();
    if (isExecute) {
      await notify('clear', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[clear]: Очистить очередь не вышло: плеер не играет`);
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
      await notify('clear', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[clear]: Очистить очередь не вышло: не совпадают каналы`);
    return {result: "Не совпадают каналы"};
  }

  clearQueue(interaction.guildId);//TODO обнулять время оставшееся для воспроизведения (не проверял мб уже есть но есть баг репорт)
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle('Э-эм. а где все?')
    .setDescription(`Ох.. Эти времена, эти нравы.. Кто-то созидает, а кто-то может только уничтожать.
            Поздравляю разрушитель, у тебя получилось. **Плейлист очищен**`);
  if (isExecute) {
    await notify('clear', interaction, {embeds: [embed]});
  }
  logGuild(interaction.guildId, `[clear]: Плейлист успешно очищен`);
  return {};
}

