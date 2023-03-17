const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {Control, Pagination} = require('../../utils/components');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {escaping, getCommandName} = require('../../utils/string');
const {getQueue, isPlaying} = require('../player');
const {notify, notifyForbidden} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {createStatus} = require('../../utils/attachments');
const {getNowPlayingDescription} = require('../../utils/player');
const {t} = require('i18next');
const {timeFormatSeconds} = require('../../utils/dateTime');

const {start, count} = {start: 0, count: 5};

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.queue.description')),
  execute: interaction => queue(interaction),
  listener: interaction => onQueue(interaction),
};

const queue = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_QUEUE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const songs = getQueue(interaction.guildId).songs;
  const pagination = Pagination.getComponent(start, count, songs.length);

  if (!isPlaying(interaction.guildId)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp()
      .setFooter({text: Pagination.getFooter(start, count, songs.length)});
    await notify(interaction, {embeds: [embed], components: [pagination]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:info.noPlaying', {command: getCommandName(__filename)}),
    });
    return;
  }

  const control = Control.getComponent(interaction);
  const status = await createStatus(interaction.guildId);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
    .setDescription(await getDescription(getQueue(interaction.guildId), start, count))
    .setTimestamp()
    .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
    .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
    .setFooter({text: Pagination.getFooter(start, count, songs.length)});
  await notify(interaction, {files: [status], embeds: [embed], components: [pagination, control]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.queue.completed'),
  });
};

const onQueue = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_QUEUE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const songs = getQueue(interaction.guildId).songs;
  const embed = interaction.message.embeds[0];
  const pagination = interaction.message.components[0];
  const pages = Pagination.getPages(embed.footer.text);
  const start = Pagination.update(interaction, pages, songs.length);
  const control = getQueue(interaction.guildId).nowPlaying?.song
    ? Control.getComponent(interaction)
    : interaction.message.components[1];

  if (control) {
    await Control.update(interaction, control);
  }

  if (!isPlaying(interaction.guildId)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp()
      .setFooter({text: Pagination.getFooter(start, pages.count, songs.length)});
    await interaction.message.removeAttachments();
    await interaction.update({embeds: [embed], components: [pagination]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:info.noPlaying', {command: getCommandName(__filename)}),
    });
    return;
  }

  const status = await createStatus(interaction.guildId);

  embed
    .setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
    .setDescription(await getDescription(getQueue(interaction.guildId), start, count))
    .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
    .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, songs.length)});
  await interaction.message.removeAttachments();
  await interaction.update({files: [status], embeds: [embed], components: [pagination, control]});
};

const getDescription = async (queue, start, count) => {
  const getCounter = index => String(start + index + 1)
    .padStart(String(queue.songs.length).length, '0');
  const getDuration = song => song.isLive
    ? t('common:player.stream')
    : timeFormatSeconds(song.duration);
  const getTitle = song => `[${escaping(song.title)}](${song.url})`;

  const nowPlaying = await getNowPlayingDescription(queue.nowPlaying);
  const songs = queue.songs
    .slice(start, start + count)
    .map((song, index) => t('discord:command.queue.completed.song', {
      counter: getCounter(index),
      title: getTitle(song),
      duration: getDuration(song),
      author: song.author.username,
    }));

  return [nowPlaying, ...songs].join('\n\n');
};
