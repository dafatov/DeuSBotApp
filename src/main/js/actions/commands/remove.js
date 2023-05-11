const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {escaping, getCommandName} = require('../../utils/string');
const {isLessQueue, isSameChannel, isValidIndex, remove} = require('../player');
const {notify, notifyForbidden, notifyNoPlaying, notifyUnbound, notifyUnequalChannels} = require('../commands');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.remove.description'))
    .addIntegerOption(o => o
      .setName('target')
      .setDescription(t('discord:command.remove.option.target.description'))
      .setRequired(true)),
  execute: interaction => module.exports.remove(interaction, true),
};

module.exports.remove = async (interaction, isExecute,
  targetIndex = interaction.options.getInteger('target') - 1,
) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_REMOVE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return {result: t('web:info.forbidden', {command: getCommandName(__filename)})};
  }

  if (await isLessQueue(interaction.guildId, 1)) {
    await notifyNoPlaying(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.noPlaying')};
  }

  if (!isSameChannel(interaction.guildId, interaction.member.voice.channel?.id)) {
    await notifyUnequalChannels(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unequalChannels')};
  }

  if (!await isValidIndex(interaction.guildId, targetIndex)) {
    await notifyUnbound(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unbound')};
  }

  const target = await remove(interaction.guildId, targetIndex);

  if (isExecute) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.remove.completed.title'))
      .setDescription(t('discord:command.remove.completed.description', {title: escaping(target.title)}))
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.remove.completed'),
  });
  return {isRemoved: target};
};
