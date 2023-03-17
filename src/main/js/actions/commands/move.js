const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {escaping, getCommandName} = require('../../utils/string');
const {isLessQueue, isSameChannel, isValidIndex, moveQueue} = require('../player');
const {notify, notifyForbidden, notifyNoPlaying, notifyUnbound, notifyUnequalChannels} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.move.description'))
    .addIntegerOption(o => o
      .setName('target')
      .setDescription(t('discord:command.move.option.target.description'))
      .setRequired(true))
    .addIntegerOption(o => o
      .setName('position')
      .setDescription(t('discord:command.move.option.position.description'))
      .setRequired(true)),
  execute: interaction => module.exports.move(interaction, true),
};

module.exports.move = async (interaction, isExecute,
  positionIndex = interaction.options.getInteger('position') - 1,
  targetIndex = interaction.options.getInteger('target') - 1,
) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_MOVE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return {result: t('web:info.forbidden', {command: getCommandName(__filename)})};
  }

  if (isLessQueue(interaction.guildId, 2)) {
    await notifyNoPlaying(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.noPlaying')};
  }

  if (!isSameChannel(interaction)) {
    await notifyUnequalChannels(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unequalChannels')};
  }

  if (!isValidIndex(interaction.guildId, targetIndex)
    || !isValidIndex(interaction.guildId, positionIndex)) {
    await notifyUnbound(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unbound')};
  }

  const target = moveQueue(interaction.guildId, targetIndex, positionIndex);

  if (isExecute) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.move.completed.title'))
      .setDescription(t('discord:command.move.completed.description', {
        title: escaping(target.title),
        position: positionIndex + 1,
      }))
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.move.completed'),
  });
  return {isMoved: target, newIndex: positionIndex};
};
