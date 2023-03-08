const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyForbidden} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {getCommandName} = require('../../utils/string');
const helps = require('../../configs/help.js');
const {t} = require('i18next');
const {version} = require('../../../../../package.json');

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

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.help.completed.title', {source: command ?? 'боту Deus'}))
    .setDescription(helps.get(command)
      ?? t('discord:command.help.completed.description', {
        version,
        url: process.env.DEUS_BOT_WEB_URL,
      }))
    .setFooter({
      text: t('discord:command.help.completed.footer', {currentYear: new Date().getFullYear()}),
      iconURL: 'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
    });
  await notify(getCommandName(__filename), interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.help', {source: command ?? 'боту Deus'}),
  });
};
