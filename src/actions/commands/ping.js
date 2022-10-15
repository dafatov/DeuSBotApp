const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyError} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription(t('discord:command.ping.description')),
  async execute(interaction) {
    await ping(interaction);
  },
};

const ping = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PING)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'ping'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('ping', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'ping'}),
    });
    return;
  }

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.ping.completed.title'))
    .setTimestamp()
    .setDescription(t('discord:command.ping.completed.description', {ping: Math.round(interaction.client.ws.ping)}));

  try {
    await notify('ping', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.ping'),
    });
  } catch (e) {
    await notifyError('ping', e, interaction);
  }
};
