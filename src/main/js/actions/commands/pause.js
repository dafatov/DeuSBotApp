const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {isLive, isPlaying, isSameChannel, pause} = require('../player');
const {notify, notifyForbidden, notifyIsLive, notifyNoPlaying, notifyUnequalChannels} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName('pause')
    .setDescription(t('discord:command.pause.description')),
  execute: interaction => module.exports.pause(interaction, true),
};

module.exports.pause = async (interaction, isExecute) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PAUSE)) {
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

  const isPause = pause(interaction.guildId);

  if (isExecute) {
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.pause.completed.title', {
        status: isPause
          ? t('common:player.paused')
          : t('common:player.resumed'),
      }))
      .setDescription(`${(isPause
        ? t('discord:command.pause.completed.description.paused')
        : t('discord:command.pause.completed.description.resumed'))}`)
      .setTimestamp();
    await notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.pause.completed', {
      status: isPause
        ? t('common:player.paused')
        : t('common:player.resumed'),
    }),
  });
  return {isPause};
};
