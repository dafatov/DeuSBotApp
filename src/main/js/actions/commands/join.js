const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {createConnection, getQueue} = require('../player');
const {notify, notifyForbidden} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {VoiceConnectionStatus} = require('@discordjs/voice');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.join.description')),
  execute: interaction => module.exports.join(interaction, true),
};

module.exports.join = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_JOIN)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  if (getQueue(interaction.guildId)?.connection
    && getQueue(interaction.guildId)?.connection?._state.status !== VoiceConnectionStatus.Destroyed) {
    return;
  }

  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.join.noVoiceChannel.title'))
      .setDescription(t('discord:command.join.noVoiceChannel.description'))
      .setTimestamp();
    await notify(getCommandName(__filename), interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.join.noVoiceChannel'),
    });
    return;
  }

  createConnection(interaction, voiceChannel);

  if (isExecute) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.join.completed.title'))
      .setDescription(t('discord:command.join.completed.description', {name: voiceChannel.name}))
      .setTimestamp();
    await notify(getCommandName(__filename), interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.join.completed', {name: voiceChannel.name}),
  });
};
