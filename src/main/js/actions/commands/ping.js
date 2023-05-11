const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyForbidden} = require('../commands');
const {audit} = require('../auditor');
const config = require('../../configs/config');
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

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.ping.completed.title'))
    .setTimestamp()
    .setDescription(t('discord:command.ping.completed.description', {ping: Math.round(interaction.client.ws.ping)}));
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.ping'),
  });
};
