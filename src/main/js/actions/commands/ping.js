const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyForbidden} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.ping.description')),
  execute: interaction => ping(interaction),
};

const ping = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PING)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.ping.completed.title'))
    .setTimestamp()
    .setDescription(t('discord:command.ping.completed.description', {ping: Math.round(interaction.client.ws.ping)}));
  await notify(getCommandName(__filename), interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.ping'),
  });
};
