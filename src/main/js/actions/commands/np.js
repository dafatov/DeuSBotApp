const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {escaping, getCommandName} = require('../../utils/string');
const {getNowPlaying, isPlaying} = require('../player');
const {notify, notifyForbidden, notifyNoPlaying} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {createStatus} = require('../../utils/attachments');
const {getNowPlayingDescription} = require('../../utils/player');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.np.description')),
  execute: interaction => np(interaction),
};

const np = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_NP)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  if (!isPlaying(interaction.guildId)) {
    await notifyNoPlaying(getCommandName(__filename), interaction);
    return;
  }

  const nowPlaying = getNowPlaying(interaction.guildId);
  const status = await createStatus(interaction.guildId, nowPlaying);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(nowPlaying.song.title))
    .setDescription(await getNowPlayingDescription(interaction, nowPlaying))
    .setURL(nowPlaying.song.url)
    .setThumbnail(nowPlaying.song.preview)
    .setTimestamp();
  await notify(interaction, {files: [status], embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.np.completed'),
  });
};
