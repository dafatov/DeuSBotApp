const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {clearQueue, getQueue} = require('../player');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {notify} = require('../commands');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription(t('discord:command.clear.description')),
  async execute(interaction) {
    await module.exports.clear(interaction, true);
  },
};

module.exports.clear = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_CLEAR)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'clear'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('clear', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'clear'}),
    });
    return {result: t('web:info.forbidden', {command: 'clear'})};
  }

  if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player
    || getQueue(interaction.guildId).songs.length === 0) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('clear', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.clear.noPlaying'),
    });
    return {result: t('web:info.noPlaying')};
  }

  if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
    && getQueue(interaction.guildId).connection.joinConfig.channelId
    !== interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unequalChannels.title'))
      .setDescription(t('discord:embed.unequalChannels.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('clear', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.clear.unequalChannels'),
    });
    return {result: t('web:info.unequalChannels')};
  }

  clearQueue(interaction.guildId);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.clear.completed.title'))
    .setDescription(t('discord:command.clear.completed.description'));
  if (isExecute) {
    await notify('clear', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.clear.cleared'),
  });
  return {};
};

