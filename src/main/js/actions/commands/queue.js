const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {Control, Pagination} = require('../../utils/components');
const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {escaping, getCommandName} = require('../../utils/string');
const {getNowPlaying, getPage, getSize, isPlaying} = require('../player');
const {notify, notifyForbidden} = require('../commands');
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

  const songsCount = await getSize(interaction.guildId);
  const pagination = Pagination.getComponent(start, count, songsCount);

  if (!isPlaying(interaction.guildId)) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp()
      .setFooter({text: Pagination.getFooter(start, count, songsCount)});
    await notify(interaction, {embeds: [embed], components: [pagination]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:info.noPlaying', {command: getCommandName(__filename)}),
    });
    return;
  }

  const nowPlaying = getNowPlaying(interaction.guildId);
  const control = Control.getComponent(nowPlaying);
  const status = await createStatus(interaction.guildId, nowPlaying);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(escaping(nowPlaying.song.title))
    .setDescription(await getDescription(interaction, start, count, songsCount, nowPlaying))
    .setTimestamp()
    .setURL(nowPlaying.song.url)
    .setThumbnail(nowPlaying.song.preview)
    .setFooter({text: Pagination.getFooter(start, count, songsCount)});
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

  const songsCount = await getSize(interaction.guildId);
  const embed = EmbedBuilder.from(interaction.message.embeds[0]);
  const pages = Pagination.getPages(embed);
  const {start, pagination} = Pagination.update(interaction, pages, songsCount);
  const nowPlaying = getNowPlaying(interaction.guildId);
  const control = await Control.update(interaction, nowPlaying);

  if (!isPlaying(interaction.guildId)) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp()
      .setFooter({text: Pagination.getFooter(start, pages.count, songsCount)});
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

  const status = await createStatus(interaction.guildId, nowPlaying);

  embed
    .setColor(config.colors.info)
    .setTitle(escaping(nowPlaying.song.title))
    .setDescription(await getDescription(interaction, start, count, songsCount, nowPlaying))
    .setURL(nowPlaying.song.url)
    .setThumbnail(nowPlaying.song.preview)
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, songsCount)});
  await interaction.message.removeAttachments();
  await interaction.update({files: [status], embeds: [embed], components: [pagination, control]});
};

const getDescription = async (interaction, start, count, songsCount, nowPlaying) => {
  const getCounter = index => String(start + index + 1)
    .padStart(String(songsCount ?? 0).length, '0');
  const getTitle = song => `[${escaping(song.title)}](${song.url})`;
  const getDuration = song => song.isLive
    ? t('common:player.stream')
    : timeFormatSeconds(song.duration) ?? t('common:player.overDay');

  const nowPlayingDescription = await getNowPlayingDescription(interaction, nowPlaying);
  const songs = await getPage(interaction.guildId, start, start + count)
    .then(songs => Promise.all(songs
      .sort((a, b) => a.index - b.index)
      .map(async (song, index) => t('discord:command.queue.completed.song', {
        counter: getCounter(index),
        title: getTitle(song),
        duration: getDuration(song),
        author: await interaction.guild.fetch()
          .then(guild => guild.members.fetch(nowPlaying.song.userId))
          .then(member => member.displayName),
      }))));

  return [nowPlayingDescription, ...songs].join('\n\n');
};
