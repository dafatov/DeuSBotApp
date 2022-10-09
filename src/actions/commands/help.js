const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const helps = require('../../configs/help.js');
const {notify} = require('../commands');
const {t} = require('i18next');
const {version} = require('../../../package');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription(t('discord:command.help.description'))
    .addStringOption(s => s
      .setName('command')
      .setDescription(t('discord:command.help.option.command.description'))
      .setRequired(false)
      .addChoices([...helps.keys()].map(k => [k, k]))),
  async execute(interaction) {
    await help(interaction);
  },
};

const help = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_HELP)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'help'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('help', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'help'}),
    });
    return;
  }

  const command = interaction.options.getString('command');

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.help.completed.title', {source: command ?? 'боту Deus'}))
    .setDescription(helps.get(command)
      ?? t('discord:command.help.completed.description', {
        version,
        url: process.env.DEUS_BOT_WEB_URL,
      }))
    .setFooter(
      t('discord:command.help.completed.footer'),
      'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
    );
  await notify('help', interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.help', {source: command ?? 'боту Deus'}),
  });
};
