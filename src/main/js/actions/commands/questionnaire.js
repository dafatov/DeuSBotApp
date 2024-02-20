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
const {DISCORD_BUTTON_LABEL_MAX, DISCORD_ROWS_MAX} = require('../../utils/constants');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {getCommandName, spell} = require('../../utils/string');
const {getFixedT, t} = require('i18next');
const {notify, notifyForbidden} = require('../commands');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const groupBy = require('lodash/groupBy');
const progressBar = require('string-progressbar');

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
    .setTitle(t('discord:command.questionnaire.modal.title', getTitleParams(title.replaceAll('_', ' '), duration)))
    .setComponents(...Array(DISCORD_ROWS_MAX).fill()
      .map((textInput, index) => new TextInputBuilder()
        .setCustomId(`questionnaireOption${index}`)
        .setLabel(t('discord:command.questionnaire.modal.textInput.title', {number: index + 1}))
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(DISCORD_BUTTON_LABEL_MAX)
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
  let duration = customIdParams[0];
  const title = customIdParams[1].replaceAll('_', ' ');

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.questionnaire.started.title', getTitleParams(title, duration)))
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

  const interactionResponsesByUser = {};
  const collector = message.createMessageComponentCollector({componentType: ComponentType.Button, time: 1000 * 60 * duration});
  const intervalId = setInterval(async () => {
    embed.setTitle(t('discord:command.questionnaire.started.title', getTitleParams(title, --duration)));
    await message.edit({embeds: [embed]});
  }, 1000 * 60);
  const onAfterCollectorEndFunction = module.exports.onAfterCollectorEnd(message, interactionResponsesByUser, collector, interaction.guildId, intervalId);

  collector.on('collect', onCollectorCollect(options, interactionResponsesByUser));
  collector.once('end', onCollectorEnd(interactionResponsesByUser, options, title, onAfterCollectorEndFunction));
};

const onCollectorCollect = (options, interactionResponsesByUser) => async interaction => {
  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.questionnaire.chosen.title'))
    .setDescription(options[getOptionIndex(interaction)])
    .setTimestamp();

  interactionResponsesByUser[interaction.user.id]?.delete();
  interactionResponsesByUser[interaction.user.id] = await interaction.reply({embeds: [embed], ephemeral: true});
};

const onCollectorEnd = (interactionResponsesByUser, options, title, onAfterCollectorEnd) => async (_, reason) => {
  const interactionResponsesByOption = groupBy(
    Object.values(interactionResponsesByUser),
    interactionResponse => getOptionIndex(interactionResponse.interaction),
  );
  const allCount = Object.values(interactionResponsesByOption).reduce((acc, interactionResponses) => acc + interactionResponses.length, 0);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.questionnaire.completed.title', {
      title,
      count: spell(allCount, Object.values(getFixedT(null, null, 'common:things')('votes', {returnObjects: true}).name)),
    }))
    .setDescription(t('discord:command.questionnaire.completed.description'))
    .setFields(options.map((option, index) => {
      const interactionResponses = interactionResponsesByOption[index];

      if (!interactionResponses) {
        return {name: option, value: getFieldValue(0, 1, [])};
      }

      return {
        name: option,
        value: getFieldValue(
          interactionResponses.length,
          allCount,
          interactionResponses.map(interactionResponse => interactionResponse.interaction.user.toString()),
        ),
      };
    }))
    .setTimestamp();

  await onAfterCollectorEnd({embeds: [embed], components: []}, reason);
};

const onAfterCollectorEnd = (message, interactionResponsesByUser, collector, guildId, intervalId) => async (content, reason) => {
  clearInterval(intervalId);
  message.edit(content);
  Object.values(interactionResponsesByUser).forEach(interactionResponse => interactionResponse.delete());
  collector.removeAllListeners('collect');
  await audit({
    guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.questionnaire.completed', {reason}),
  });
};

const getOptionIndex = interaction => parseInt(interaction.customId.split('_')[1]);

const getTitleParams = (title, duration) => ({
  title,
  duration: spell(duration, Object.values(getFixedT(null, null, 'common:time')('minutes', {returnObjects: true}).name)),
});

const getFieldValue = (count, allCount, users) => {
  const barString = progressBar.filledBar(allCount, count, 30, '◻', '◼');

  return t('discord:command.questionnaire.completed.field.result', {
    count,
    barString: barString[0],
    percent: Math.floor(barString[1]),
    users: users.join(''),
  });
};

module.exports.onCollectorCollect = onCollectorCollect;
module.exports.onCollectorEnd = onCollectorEnd;
module.exports.onAfterCollectorEnd = onAfterCollectorEnd;
