const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {arrayMoveMutable} = require('../../utils/array.js');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {escaping} = require('../../utils/string');
const {getQueue} = require('../player');
const {notify} = require('../commands');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription(t('discord:command.move.description'))
    .addIntegerOption(o => o
      .setName('target')
      .setDescription(t('discord:command.move.option.target.description'))
      .setRequired(true))
    .addIntegerOption(o => o
      .setName('position')
      .setDescription(t('discord:command.move.option.position.description'))
      .setRequired(true)),
  async execute(interaction) {
    await module.exports.move(interaction, true);
  },
};

module.exports.move = async (interaction, isExecute, positionIndex = interaction.options.getInteger('position') - 1,
  targetIndex = interaction.options.getInteger('target') - 1,
) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_MOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'move'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('move', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'move'}),
    });
    return {result: t('web:info.forbidden', {command: 'move'})};
  }

  if (!getQueue(interaction.guildId).songs || getQueue(interaction.guildId).songs.length < 2) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.move.noPlaying.title'))
      .setDescription(`${getQueue(interaction.guildId).songs.length === 0
        ? t('discord:command.move.noPlaying.description.zeroSongs')
        : t('discord:command.move.noPlaying.description.oneSong')}`)
      .setTimestamp();
    if (isExecute) {
      await notify('move', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.move.noPlaying'),
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
      await notify('move', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.move.unequalChannels'),
    });
    return {result: t('web:info.unequalChannels')};
  }

  if (targetIndex < 0 || targetIndex + 1 > getQueue(interaction.guildId).songs.length
    || positionIndex < 0 || positionIndex + 1 > getQueue(interaction.guildId).songs.length) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unbound.title'))
      .setDescription(t('discord:embed.unbound.description', {length: getQueue(interaction.guildId).songs.length}))
      .setTimestamp();
    if (isExecute) {
      await notify('move', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.move.unbound'),
    });
    return {result: t('web:info.unbound')};
  }

  const target = getQueue(interaction.guildId).songs[targetIndex];

  arrayMoveMutable(getQueue(interaction.guildId).songs, targetIndex, positionIndex);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.move.completed.title'))
    .setDescription(t('discord:command.move.completed.description', {title: escaping(target.title), position: positionIndex + 1}));
  if (isExecute) {
    await notify('move', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.move.completed'),
  });
  return {isMoved: target, newIndex: positionIndex};
};
