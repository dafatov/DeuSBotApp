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
    .setName('loop')
    .setDescription(t('discord:command.loop.description')),
  async execute(interaction) {
    await module.exports.loop(interaction, true);
  },
};

module.exports.loop = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_LOOP)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'loop'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('loop', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'loop'}),
    });
    return {result: t('web:info.forbidden', {command: 'loop'})};
  }

  if (!getQueue(interaction.guildId).nowPlaying.song || !getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('loop', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.loop.noPlaying'),
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
      await notify('loop', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.loop.unequalChannels'),
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
      await notify('loop', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.loop.live'),
    });
    return {result: t('web:info.live')};
  }

  const isLoop = getQueue(interaction.guildId).nowPlaying.isLoop;
  getQueue(interaction.guildId).nowPlaying.isLoop = !isLoop;
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.loop.completed.title', {
      status: isLoop
        ? t('common:player.unloop')
        : t('common:player.loop'),
    }))
    .setDescription(`${isLoop
      ? t('discord:command.loop.completed.description.unloop')
      : t('discord:command.loop.completed.description.loop')}`);
  if (isExecute) {
    await notify('loop', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.loop.completed', {
      status: isLoop
        ? t('common:player.unloop')
        : t('common:player.loop'),
    }),
  });
  return {isLoop: getQueue(interaction.guildId).nowPlaying.isLoop};
};
