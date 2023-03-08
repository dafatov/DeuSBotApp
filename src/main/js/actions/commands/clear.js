const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {clearQueue, getQueue} = require('../player');
const {notify, notifyForbidden, notifyNoPlaying, notifyUnequalChannels} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.clear.description')),
  execute: interaction => module.exports.clear(interaction, true),
};

module.exports.clear = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_CLEAR)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return {result: t('web:info.forbidden', {command: getCommandName(__filename)})};
  }

  if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player
    || !getQueue(interaction.guildId).songs?.length) {
    await notifyNoPlaying(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.noPlaying')};
  }

  if (getQueue(interaction.guildId).connection?.joinConfig.channelId
    !== interaction.member.voice.channel?.id) {
    await notifyUnequalChannels(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unequalChannels')};
  }

  clearQueue(interaction.guildId);

  if (isExecute) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.clear.completed.title'))
      .setDescription(t('discord:command.clear.completed.description'))
      .setTimestamp();
    await notify(getCommandName(__filename), interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.clear.cleared'),
  });
  return {};
};

