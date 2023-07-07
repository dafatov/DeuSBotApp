const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyForbidden} = require('../commands');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {getCommandName} = require('../../utils/string');
const helps = require('../../configs/help');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.help.description'))
    .addStringOption(s => s
      .setName('command')
      .setDescription(t('discord:command.help.option.command.description'))
      .setRequired(false)
      .addChoices(...Array.from(helps, ([key]) => ({name: key, value: key})))),
  execute: interaction => help(interaction),
};

const help = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_HELP)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const command = interaction.options.getString('command');

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.help.completed.title', {source: command ?? 'боту Deus'}))
    .setDescription(helps.get(command)
      ?? t('discord:command.help.completed.description', {
        version: process.env.npm_package_version,
        url: process.env.DEUS_BOT_WEB_URL,
      }))
    .setFooter({
      text: t('discord:command.help.completed.footer', {currentYear: new Date().getFullYear()}),
      iconURL: 'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
    });
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.help', {source: command ?? 'боту Deus'}),
  });
};
