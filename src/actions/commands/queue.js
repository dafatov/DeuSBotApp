const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyError} = require('../commands');
const {timeFormatMilliseconds, timeFormatSeconds} = require('../../utils/dateTime.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {createStatus} = require('../../utils/attachments');
const {escaping} = require('../../utils/string.js');
const {getQueue} = require('../player');
const {getRadios} = require('../radios');
const {loop} = require('./loop');
const {pause} = require('./pause');
const progressBar = require('string-progressbar');
const {skip} = require('./skip');
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

  if (!getQueue(interaction.guildId).nowPlaying.song) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    await notify('queue', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.queue.noPlaying'),
    });
    return;
  }

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setFooter(t(
      'discord:command.queue.completed.footer', {
        countStart: Math.min(start + 1, songs.length),
        countFinish: Math.min(start + count, songs.length),
        total: songs.length,
        step: count,
      },
    ));

  embed.setFields(songs
    .slice(start, count)
    .map((song, i) => ({
      name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${escaping(song.title)}`,
      value: `\`${song.isLive
        ? t('common:player.stream')
        : timeFormatSeconds(song.length)}\`—_\`${song.author.username}\`_`,
    })));

  embed.setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
    .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
    .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
    .setTimestamp();
  await setDescription(interaction, embed);

  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('first')
        .setLabel(t('common:player.first'))
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('previous')
        .setLabel(t('common:player.previous'))
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('update')
        .setLabel(t('common:player.update'))
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('next')
        .setLabel(t('common:player.next'))
        .setStyle('PRIMARY')
        .setDisabled(start + count >= songs.length),
      new MessageButton()
        .setCustomId('last')
        .setLabel(t('common:player.last'))
        .setStyle('PRIMARY')
        .setDisabled(start + count >= songs.length),
    );

  const control = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('pause')
        .setLabel(getQueue(interaction.guildId).nowPlaying?.isPause
          ? t('common:player.toResume')
          : t('common:player.toPause'))
        .setStyle(getQueue(interaction.guildId).nowPlaying?.isPause
          ? 'SUCCESS'
          : 'DANGER')
        .setDisabled(getQueue(interaction.guildId).nowPlaying?.song.isLive),
      new MessageButton()
        .setCustomId('skip')
        .setLabel(t('common:player.skip'))
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('loop')
        .setLabel(getQueue(interaction.guildId).nowPlaying?.isLoop
          ? t('common:player.toUnloop')
          : t('common:player.toLoop'))
        .setStyle(getQueue(interaction.guildId).nowPlaying?.isLoop
          ? 'DANGER'
          : 'SUCCESS')
        .setDisabled(getQueue(interaction.guildId).nowPlaying?.song.isLive),
    );

  const status = await createStatus(getQueue(interaction.guildId));
  try {
    await notify('queue', interaction, {files: [status], embeds: [embed], components: [row, control]});
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
  const row = interaction.message.components[0];
  const control = interaction.message.components[1];
  const pages = calcPages(embed.footer.text);
  const count = pages.count;
  let start = pages.start;

  if (interaction.customId === 'next') {
    start += count;
  }
  if (interaction.customId === 'previous') {
    start -= count;
  }
  if (interaction.customId === 'update') {
    start = Math.min(start, count * Math.floor(Math.max(0, songs.length - 1) / count));
  }
  if (interaction.customId === 'first') {
    start = 0;
  }
  if (interaction.customId === 'last') {
    start = count * Math.floor((songs.length - 1) / count);
  }

  if (interaction.customId === 'pause') {
    await pause(interaction);
  }
  if (interaction.customId === 'skip') {
    await skip(interaction);
  }
  if (interaction.customId === 'loop') {
    await loop(interaction);
  }

  if (songs.length === 0 && !getQueue(interaction.guildId).nowPlaying.song) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    await interaction.message.removeAttachments();
    await interaction.update({embeds: [embed], components: []});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.queue.noPlaying'),
    });
    return;
  }

  row.components.forEach(b => {
    if (b.customId === 'next') {
      b.setDisabled(start + count >= songs.length);
    }
    if (b.customId === 'previous') {
      b.setDisabled(start <= 0);
    }
    if (b.customId === 'first') {
      b.setDisabled(start <= 0);
    }
    if (b.customId === 'last') {
      b.setDisabled(start + count >= songs.length);
    }
  });
  control.components.forEach(b => {
    if (b.customId === 'pause') {
      b.setLabel(getQueue(interaction.guildId).nowPlaying?.isPause
        ? t('common:player.toResume')
        : t('common:player.toPause'));
      b.setStyle(getQueue(interaction.guildId).nowPlaying?.isPause
        ? 'SUCCESS'
        : 'DANGER');
      b.setDisabled(getQueue(interaction.guildId).nowPlaying?.song.isLive);
    }
    if (b.customId === 'loop') {
      b.setLabel(getQueue(interaction.guildId).nowPlaying?.isLoop
        ? t('common:player.toUnloop')
        : t('common:player.toLoop'));
      b.setStyle(getQueue(interaction.guildId).nowPlaying?.isLoop
        ? 'DANGER'
        : 'SUCCESS');
      b.setDisabled(getQueue(interaction.guildId).nowPlaying?.song.isLive);
    }
  });

  embed.setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
    .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
    .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
    .setTimestamp()
    .setFields(songs
      .slice(start, start + count)
      .map((song, i) => ({
        name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${escaping(song.title)}`,
        value: `\`${song.isLive
          ? t('common:player.stream')
          : timeFormatSeconds(song.length)}\`—_\`${song.author.username}\`_`,
      })))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter(t(
      'discord:command.queue.completed.footer', {
        countStart: Math.min(start + 1, songs.length),
        countFinish: Math.min(start + count, songs.length),
        total: songs.length,
        step: count,
      },
    ));
  await setDescription(interaction, embed);

  const status = await createStatus(getQueue(interaction.guildId));
  try {
    await interaction.message.removeAttachments();
    await interaction.update({files: [status], embeds: [embed], components: [row, control]});
  } catch (e) {
    await notifyError('queue', e, interaction);
  }
};

const calcPages = footer => {
  const array = footer.split(' ');
  return {start: Math.max(array[0], 1) - 1, count: parseInt(array[6])};
};

const setDescription = async (interaction, embed) => {
  if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
    embed.setDescription(t('discord:command.queue.completed.description.live'));
    if (getQueue(interaction.guildId).nowPlaying.song.type === 'radio') {
      embed.setDescription(await getRadios().get(getQueue(interaction.guildId).nowPlaying.song.title).getInfo());
    }
  } else {
    const barString = progressBar.filledBar(
      getQueue(interaction.guildId).nowPlaying.song.length * 1000,
      getQueue(interaction.guildId).nowPlaying.resource.playbackDuration,
    );
    embed.setDescription(t('discord:command.queue.completed.description.withBar', {
      playbackDuration: timeFormatMilliseconds(getQueue(interaction.guildId).nowPlaying.resource.playbackDuration),
      totalDuration: timeFormatSeconds(getQueue(interaction.guildId).nowPlaying.song.length),
      author: getQueue(interaction.guildId).nowPlaying.song.author.username,
      barString: barString[0],
      percent: Math.round(barString[1]),
    }));
  }
};
