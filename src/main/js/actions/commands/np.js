const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {escaping, getCommandName} = require('../../utils/string');
const {getQueue, isPlaying} = require('../player');
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

  const status = await createStatus(interaction.guildId);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
    .setDescription(await getNowPlayingDescription(getQueue(interaction.guildId).nowPlaying))
    .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
    .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
    .setTimestamp()
    .setFooter({
      text: t('discord:command.np.completed.footer', {author: getQueue(interaction.guildId).nowPlaying.song.author.username}),
      iconURL: getQueue(interaction.guildId).nowPlaying.song.author.iconURL,
    });
  await notify(interaction, {files: [status], embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.np.completed'),
  });
};
