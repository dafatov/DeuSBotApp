const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {getQueue} = require('../player');
const {notify} = require('../commands');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription(t('discord:command.pause.description')),
  async execute(interaction) {
    await module.exports.pause(interaction, true);
  },
};

module.exports.pause = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PAUSE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'pause'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('pause', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'pause'}),
    });
    return {result: t('web:info.forbidden', {command: 'pause'})};
  }

  if (!getQueue(interaction.guildId).nowPlaying.song || !getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('pause', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.pause.noPlaying'),
    });
    return {result: t('web:info.noPlaying')};
  }

  if (getQueue(interaction.guildId)?.connection?.joinConfig?.channelId
    !== interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unequalChannels.title'))
      .setDescription(t('discord:embed.unequalChannels.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('pause', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.pause.unequalChannels'),
    });
    return {result: t('web:info.unequalChannels')};
  }

  if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.loop.live.title'))
      .setDescription(t('discord:command.loop.live.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('pause', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.pause.live'),
    });
    return {result: t('web:info.live')};
  }

  const isPause = getQueue(interaction.guildId).nowPlaying.isPause;
  if (isPause) {
    getQueue(interaction.guildId).player.unpause();
  } else {
    getQueue(interaction.guildId).player.pause();
  }
  getQueue(interaction.guildId).nowPlaying.isPause = !isPause;
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.pause.completed.title', {
      status: isPause
        ? t('common:player.resumed')
        : t('common:player.paused'),
    }))
    .setDescription(`${isPause
      ? t('discord:command.pause.completed.description.resumed')
      : t('discord:command.pause.completed.description.paused')}`);
  if (isExecute) {
    await notify('pause', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.pause.completed', {
      status: isPause
        ? t('common:player.resumed')
        : t('common:player.paused'),
    }),
  });
  return {isPause: getQueue(interaction.guildId).nowPlaying.isPause};
};
