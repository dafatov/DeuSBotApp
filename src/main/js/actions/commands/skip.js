const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {escaping} = require('../../utils/string.js');
const {notify} = require('../commands');
const player = require('../player');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription(t('discord:command.skip.description')),
  async execute(interaction) {
    await module.exports.skip(interaction, true);
  },
};

module.exports.skip = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SKIP)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'skip'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'skip'}),
    });
    return {result: t('web:info.forbidden', {command: 'skip'})};
  }

  if (!player.getQueue(interaction.guildId).nowPlaying.song || !player.getQueue(interaction.guildId).connection
    || !player.getQueue(interaction.guildId).player) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('skip', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.remove.noPlaying'),
    });
    return {result: t('web:info.noPlaying')};
  }

  if (player.getQueue(interaction.guildId)?.connection?.joinConfig?.channelId
    !== interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unequalChannels.title'))
      .setDescription(t('discord:embed.unequalChannels.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('skip', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.clear.unequalChannels'),
    });
    return {result: t('web:info.unequalChannels')};
  }

  const skipped = await player.skip(interaction.guildId);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.skip.completed.title'))
    .setDescription(t('discord:command.skip.completed.description', {title: escaping(skipped.title)}));
  if (isExecute) {
    await notify('skip', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.skip'),
  });
  return {};
};
