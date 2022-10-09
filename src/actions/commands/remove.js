const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {escaping} = require('../../utils/string.js');
const {getQueue} = require('../player');
const {notify} = require('../commands');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription(t('discord:command.remove.description'))
    .addIntegerOption(o => o
      .setName('target')
      .setDescription(t('discord:command.remove.option.target.description'))
      .setRequired(true)),
  async execute(interaction) {
    await module.exports.remove(interaction, true);
  },
};

module.exports.remove = async (interaction, isExecute, targetIndex = interaction.options.getInteger('target') - 1) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'remove'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('remove', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'remove'}),
    });
    return {result: t('web:info.forbidden', {command: 'remove'})};
  }

  if (!getQueue(interaction.guildId).songs || getQueue(interaction.guildId).songs.length < 1) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('remove', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.remove.noPlaying'),
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
      await notify('remove', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.clear.unequalChannels'),
    });
    return {result: t('web:info.unequalChannels')};
  }

  if (targetIndex < 0 || targetIndex + 1 > getQueue(interaction.guildId).songs.length) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unbound.title'))
      .setDescription(t('discord:embed.unbound.description', {length: getQueue(interaction.guildId).songs.length}))
      .setTimestamp();
    if (isExecute) {
      await notify('remove', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.remove.unbound'),
    });
    return {result: t('web:info.unbound')};
  }

  const target = getQueue(interaction.guildId).songs[targetIndex];

  getQueue(interaction.guildId).songs.splice(targetIndex, 1);
  getQueue(interaction.guildId).remained -= target.length;
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.remove.completed.title'))
    .setDescription(t('discord:command.remove.completed.description', {title: escaping(target.title)}));
  if (isExecute) {
    await notify('remove', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.remove.completed'),
  });
  return {isRemoved: target};
};
