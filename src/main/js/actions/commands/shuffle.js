const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {getQueue} = require('../player');
const {notify} = require('../commands');
const {shuffleArray} = require('../../utils/array');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription(t('discord:command.shuffle.description')),
  async execute(interaction) {
    await module.exports.shuffle(interaction, true);
  },
};

module.exports.shuffle = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SHUFFLE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'shuffle'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'shuffle'}),
    });
    return {result: t('web:info.forbidden', {command: 'shuffle'})};
  }

  if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player
    || getQueue(interaction.guildId).songs.length <= 2) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('shuffle', interaction, {embeds: [embed]});
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
      await notify('shuffle', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.clear.unequalChannels'),
    });
    return {result: t('web:info.unequalChannels')};
  }

  shuffleArray(getQueue(interaction.guildId).songs);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.shuffle.completed.title'))
    .setDescription(t('discord:command.shuffle.completed.description'));
  if (isExecute) {
    await notify('shuffle', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.shuffle'),
  });
  return {};
};

