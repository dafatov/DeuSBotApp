const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {isPlaying, isSameChannel, skip} = require('../player');
const {notify, notifyForbidden, notifyNoPlaying, notifyUnequalChannels} = require('../commands');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {escaping} = require('../../utils/string');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.skip.description')),
  execute: interaction => module.exports.skip(interaction, true),
};

module.exports.skip = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_SKIP)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return {result: t('web:info.forbidden', {command: getCommandName(__filename)})};
  }

  if (!isPlaying(interaction.guildId)) {
    await notifyNoPlaying(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.noPlaying')};
  }

  if (!isSameChannel(interaction.guildId, interaction.member.voice.channel?.id)) {
    await notifyUnequalChannels(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.unequalChannels')};
  }

  const skipped = await skip(interaction.guildId);

  if (isExecute) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.skip.completed.title'))
      .setDescription(t('discord:command.skip.completed.description', {title: escaping(skipped.title)}))
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.skip'),
  });
  return {};
};
