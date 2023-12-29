const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {getCommandName, spell} = require('../../utils/string');
const {getFixedT, t} = require('i18next');
const {notify, notifyForbidden} = require('../commands');
const {DISCORD_ROWS_MAX} = require('../../utils/constants');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const groupBy = require('lodash/groupBy');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.questionnaire.description'))
    .addStringOption(s => s
      .setName('title')
      .setDescription(t('discord:command.questionnaire.option.title.description'))
      .setRequired(true))
    .addIntegerOption(i => i
      .setName('duration')
      .setDescription(t('discord:command.questionnaire.option.duration.description'))
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(60)),
  isDeferReply: () => false,
  execute: interaction => questionnaire(interaction),
  onModal: interaction => onModal(interaction),
  onButton: () => {},
};

const questionnaire = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_QUESTIONNAIRE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const title = interaction.options.getString('title');
  const duration = interaction.options.getInteger('duration');
  const modal = new ModalBuilder()
    .setCustomId(`${getCommandName(__filename)} ${duration}\n${title.replaceAll(' ', '_')}`)
    .setTitle(t('discord:command.questionnaire.modal.title', {
      title,
      duration: spell(duration, Object.values(getFixedT(null, null, 'common:time')('minutes', {returnObjects: true}).name)),
    }))
    .setComponents(...Array(DISCORD_ROWS_MAX).fill()
      .map((textInput, index) => new TextInputBuilder()
        .setCustomId(`questionnaireOption${index}`)
        .setLabel(t('discord:command.questionnaire.modal.textInput.title', {number: index + 1}))
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(80)
        .setRequired(index === 0))
      .map(textInput => new ActionRowBuilder().setComponents(textInput)));

  await interaction.showModal(modal);
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.questionnaire.modal'),
  });
};

const onModal = async interaction => {
  await interaction.deferReply();

  const options = interaction.fields.fields
    .map(field => field.value.trim())
    .filter(option => option);
  const customIdParams = interaction.customId.split(' ')[1].split('\n');
  const duration = customIdParams[0];
  const title = customIdParams[1].replaceAll('_', ' ');

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.questionnaire.started.title', {
      title,
      duration: spell(duration, Object.values(getFixedT(null, null, 'common:time')('minutes', {returnObjects: true}).name)),
    }))
    .setDescription(t('discord:command.questionnaire.started.description'))
    .setTimestamp();
  const components = options
    .map((option, index) => new ButtonBuilder()
      .setCustomId(`optionButton_${index}`)
      .setStyle(ButtonStyle.Primary)
      .setLabel(option))
    .map(button => new ActionRowBuilder().setComponents(button));
  const message = await notify(interaction, {embeds: [embed], components});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.questionnaire.started'),
  });

  const collector = message.createMessageComponentCollector({componentType: ComponentType.Button, time: 1000 * 60 * duration});
  const interactionResponsesByUser = {};

  collector.on('collect', onCollectorCollect(options, interactionResponsesByUser));
  collector.once('end', onCollectorEnd(interactionResponsesByUser, options, {message, collector}, interaction.guildId, title));
};

const onCollectorCollect = (options, interactionResponsesByUser) => async collectedInteraction => {
  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.questionnaire.chosen.title'))
    .setDescription(options[parseInt(collectedInteraction.customId.split('_')[1])])
    .setTimestamp();

  interactionResponsesByUser[collectedInteraction.user.id]?.delete();
  interactionResponsesByUser[collectedInteraction.user.id] = await collectedInteraction.reply({embeds: [embed], ephemeral: true});
};

const onCollectorEnd = (interactionResponsesByUser, options, {message, collector}, guildId, title) => async (_, reason) => {
  const interactionResponses = Object.values(interactionResponsesByUser);
  const interactionResponsesByOption = groupBy(interactionResponses, t => parseInt(t.interaction.customId.split('_')[1]));
  const allCount = Object.values(interactionResponsesByOption).reduce((acc, interactionResponses) => acc + interactionResponses.length, 0);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.questionnaire.completed.title', {
      title,
      count: spell(allCount, Object.values(getFixedT(null, null, 'common:things')('votes', {returnObjects: true}).name))
    }))
    .setDescription(t('discord:command.questionnaire.completed.description'))
    .setFields(options.map((option, index) => {
      const interactionResponses = interactionResponsesByOption[index];

      if (!interactionResponses) {
        return {name: option, value: t('discord:command.questionnaire.completed.field.result', {count: 0, percent: 0, users: ''})};
      }

      const users = interactionResponses.map(interactionResponse => interactionResponse.interaction.user.toString()).join(', ');

      return {
        name: option,
        value: t('discord:command.questionnaire.completed.field.result', {
          count: interactionResponses.length,
          percent: Math.floor(100 * interactionResponses.length / allCount),
          users,
        }),
      };
    }))
    .setTimestamp();

  message.edit({embeds: [embed], components: []});
  interactionResponses.forEach(interactionResponse => interactionResponse.delete());
  collector.removeAllListeners('collect');
  await audit({
    guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.questionnaire.completed', {reason}),
  });
};
