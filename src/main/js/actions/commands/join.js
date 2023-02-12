const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {VoiceConnectionStatus, joinVoiceChannel} = require('@discordjs/voice');
const {notify, notifyError} = require('../commands.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const player = require('../player.js');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription(t('discord:command.issue.description')),
  async execute(interaction) {
    await module.exports.join(interaction, true);
  },
};

module.exports.join = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_JOIN)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'join'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('join', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'join'}),
    });
    return;
  }

  if (player.getQueue(interaction.guildId)?.connection && player.getQueue(interaction.guildId)?.connection?._state.status
    !== VoiceConnectionStatus.Destroyed) {//TODO добавить возможность перетягивать бота с канала на канал, возможно, этой командой
    return;
  }

  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.join.noVoiceChannel.title'))
      .setDescription(t('discord:command.join.noVoiceChannel.description'))
      .setTimestamp();
    await notify('join', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.join.noVoiceChannel'),
    });
    return;
  }

  try {
    player.getQueue(interaction.guildId).connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    player.getQueue(interaction.guildId).voiceChannel = voiceChannel;
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.join.completed.title'))
      .setDescription(t('discord:command.join.completed.description', {name: voiceChannel.name}));
    if (isExecute) {
      await notify('join', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.join.completed', {name: voiceChannel.name}),
    });
  } catch (e) {
    await notifyError('join', e, interaction);
  }
};
