const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {Control, Pagination} = require('../../utils/components');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyError} = require('../commands');
const {timeFormatMilliseconds, timeFormatSeconds} = require('../../utils/dateTime.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {createStatus} = require('../../utils/attachments');
const {escaping} = require('../../utils/string.js');
const {getQueue} = require('../player');
const {getRadios} = require('../radios');
const progressBar = require('string-progressbar');
const {t} = require('i18next');

const {start, count} = {start: 0, count: 5};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription(t('discord:command.queue.description')),
  async execute(interaction) {
    await queue(interaction);
  },
  async listener(interaction) {
    await onQueue(interaction);
  },
};

const queue = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_QUEUE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'queue'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('queue', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'queue'}),
    });
    return;
  }

  const songs = getQueue(interaction.guildId).songs;
  const pagination = Pagination.getComponent(start, count, songs.length);

  if (!getQueue(interaction.guildId).nowPlaying.song) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp()
      .setFooter(Pagination.getFooter(start, count, songs.length));
    await notify('queue', interaction, {embeds: [embed], components: [pagination]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.queue.noPlaying'),
    });
    return;
  }

  const control = Control.getComponent(interaction);
  const status = await createStatus(getQueue(interaction.guildId));
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
    .setDescription(await getDescription(interaction))
    .setTimestamp()
    .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
    .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
    .setFields(getSongsFields(songs, start, count))
    .setFooter(Pagination.getFooter(start, count, songs.length));

  try {
    await notify('queue', interaction, {files: [status], embeds: [embed], components: [pagination, control]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.queue.completed'),
    });
  } catch (e) {
    await notifyError('queue', e, interaction);
  }
};

const onQueue = async interaction => {
  const songs = getQueue(interaction.guildId).songs;
  const embed = interaction.message.embeds[0];
  const pagination = interaction.message.components[0];
  const pages = Pagination.getPages(embed.footer.text);
  const start = Pagination.update(interaction, pages, songs.length);
  const control = songs.length > 0 || getQueue(interaction.guildId).nowPlaying.song
    ? Control.getComponent(interaction)
    : interaction.message.components[1];

  if (control) {
    await Control.update(interaction, control);
  }

  if (songs.length <= 0 && !getQueue(interaction.guildId).nowPlaying.song) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp()
      .setFooter(Pagination.getFooter(start, pages.count, songs.length));
    await interaction.message.removeAttachments();
    await interaction.update({embeds: [embed], components: [pagination]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.queue.noPlaying'),
    });
    return;
  }

  embed
    .setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
    .setDescription(await getDescription(interaction, embed))
    .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
    .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
    .setFields(getSongsFields(songs, start, pages.count))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter(Pagination.getFooter(start, pages.count, songs.length));

  const status = await createStatus(getQueue(interaction.guildId));
  try {
    await interaction.message.removeAttachments();
    await interaction.update({files: [status], embeds: [embed], components: [pagination, control]});
  } catch (e) {
    await notifyError('queue', e, interaction);
  }
};

const getDescription = async interaction => {
  if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
    if (getQueue(interaction.guildId).nowPlaying.song.type === 'radio') {
      return await getRadios().get(getQueue(interaction.guildId).nowPlaying.song.title).getInfo();
    }

    return t('discord:command.queue.completed.description.live');
  } else {
    const barString = progressBar.filledBar(
      getQueue(interaction.guildId).nowPlaying.song.length * 1000,
      getQueue(interaction.guildId).nowPlaying.resource.playbackDuration,
    );

    return t('discord:command.queue.completed.description.withBar', {
      playbackDuration: timeFormatMilliseconds(getQueue(interaction.guildId).nowPlaying.resource.playbackDuration),
      totalDuration: timeFormatSeconds(getQueue(interaction.guildId).nowPlaying.song.length),
      author: getQueue(interaction.guildId).nowPlaying.song.author.username,
      barString: barString[0],
      percent: Math.round(barString[1]),
    });
  }
};

const getSongsFields = (songs, start, count) => songs
  .slice(start, start + count)
  .map((song, i) => ({
    name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${escaping(song.title)}`,
    value: `\`${song.isLive
      ? t('common:player.stream')
      : timeFormatSeconds(song.length)}\`—_\`${song.author.username}\`_`,
  }));
