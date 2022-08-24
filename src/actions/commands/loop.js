const {SlashCommandBuilder} = require('@discordjs/builders');
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
    .setName('loop')
    .setDescription('Зациклить/отциклить проигрывание композиции'),
  async execute(interaction) {
    await module.exports.loop(interaction, true);
  },
  async listener(_interaction) {},
};

module.exports.loop = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_LOOP)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"loop\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('loop', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде loop запрещен',
    });
    return {result: 'Доступ к команде запрещен'};
  }

  if (!getQueue(interaction.guildId).nowPlaying.song || !getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Так ничего и не играло')
      .setDescription(`Как ты жалок... Зачем зацикливать, то чего нет? Или у тебя голоса в голове?`)
      .setTimestamp();
    if (isExecute) {
      await notify('loop', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[loop]: Изменить состояние зацикленности не вышло: плеер не играет`);
    return {result: "Плеер не играет"};
  }

  if (getQueue(interaction.guildId)?.connection?.joinConfig?.channelId !==
    interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Канал не тот')
      .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
      .setTimestamp();
    if (isExecute) {
      await notify('loop', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[loop]: Изменить состояние зацикленности не вышло: не совпадают каналы`);
    return {result: "Не совпадают каналы"};
  }

  if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Живая музыка')
      .setDescription(`Зациклить то, что и так играет 24/7. Ты мой работодатель? Сорян, но не выйдет, а выйдет - уволюсь`)
      .setTimestamp();
    if (isExecute) {
      await notify('loop', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[loop]: Изменить состояние зацикленности не вышло: играет стрим`);
    return "Не совпадают каналы";
  }

  let isLoop = getQueue(interaction.guildId).nowPlaying.isLoop;
  getQueue(interaction.guildId).nowPlaying.isLoop = !isLoop;
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(`Проигрывание ${isLoop ? 'отциклено' : 'зациклено'}`)
    .setDescription(`${isLoop
      ? `しーん...`
      : `オラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラ...`}`);
  if (isExecute) {
    await notify('loop', interaction, {embeds: [embed]});
  }
  logGuild(interaction.guildId, `[loop]: Композиция была успешна ${isLoop ? 'отциклена' : 'зациклена'}`);
  return {isLoop: getQueue(interaction.guildId).nowPlaying.isLoop}
}
