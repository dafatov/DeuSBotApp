const {ActionRowBuilder, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyForbidden} = require('../commands');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {createIssue} = require('../../api/external/github');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

const ISSUE_TYPES = {
  bug: t('discord:command.issue.option.type.choice.bug'),
  documentation: t('discord:command.issue.option.type.choice.documentation'),
  enhancement: t('discord:command.issue.option.type.choice.enhancement'),
};

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.issue.description'))
    .addStringOption(o => o
      .setName('type')
      .setDescription(t('discord:command.issue.option.type.description'))
      .setRequired(true)
      .setChoices(...Object.entries(ISSUE_TYPES)
        .map(([value, name]) => ({name, value})))),
  isDeferReply: () => false,
  execute: interaction => issue(interaction),
  onModal: interaction => onModal(interaction),
};

const issue = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_ISSUE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const type = interaction.options.getString('type');

  const modal = new ModalBuilder()
    .setCustomId(`${getCommandName(__filename)} ${type}`)
    .setTitle(t('discord:command.issue.modal.title', {type: ISSUE_TYPES[type]}))
    .setComponents(
      new ActionRowBuilder().setComponents(new TextInputBuilder()
        .setCustomId('title')
        .setLabel(t('discord:command.issue.modal.issueTitle.label'))
        .setPlaceholder('Краткое наименование')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)),
      new ActionRowBuilder().setComponents(new TextInputBuilder()
        .setCustomId('details')
        .setLabel(t('discord:command.issue.modal.issueDetails.label'))
        .setPlaceholder({
          bug: t('discord:command.issue.modal.issueDetails.placeholder.bug'),
          documentation: t('discord:command.issue.modal.issueDetails.placeholder.documentation'),
          enhancement: t('discord:command.issue.modal.issueDetails.placeholder.enhancement'),
        }[type])
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)),
    );

  await interaction.showModal(modal);
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.issue.modal'),
  });
};

const onModal = async interaction => {
  await interaction.deferReply();

  const issue = await createIssue(interaction.user, {
    type: interaction.customId.split(' ')[1],
    title: interaction.fields.getTextInputValue('title'),
    details: interaction.fields.getTextInputValue('details'),
  });

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.issue.completed.title', {title: issue.title}))
    .setDescription(issue.body)
    .setURL(issue.html_url)
    .setTimestamp();
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.issue.completed'),
  });
};
