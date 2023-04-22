const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {isLive, isPlaying, isSameChannel, loop} = require('../player');
const {notify, notifyForbidden, notifyIsLive, notifyNoPlaying, notifyUnequalChannels} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.loop.description')),
  execute: interaction => module.exports.loop(interaction, true),
};

module.exports.loop = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_LOOP)) {
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

  if (isLive(interaction.guildId)) {
    await notifyIsLive(getCommandName(__filename), interaction, isExecute);
    return {result: t('web:info.live')};
  }

  const isLoop = loop(interaction.guildId);

  if (isExecute) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.loop.completed.title', {
        status: isLoop
          ? t('common:player.loop')
          : t('common:player.unloop'),
      }))
      .setDescription(`${(isLoop
        ? t('discord:command.loop.completed.description.loop')
        : t('discord:command.loop.completed.description.unloop'))}`)
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.loop.completed', {
      status: isLoop
        ? t('common:player.loop')
        : t('common:player.unloop'),
    }),
  });
  return {isLoop};
};
