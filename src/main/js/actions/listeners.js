const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

module.exports = {
  onButton: interaction => onListener(
    interaction,
    interaction?.message?.interaction?.commandName?.split(' ')?.[0],
    command => command.onButton(interaction),
  ),
  onModal: interaction => onListener(
    interaction,
    interaction?.customId?.split(' ')?.[0],
    command => command.onModal(interaction),
  ),
  onSelect: interaction => onListener(
    interaction,
    interaction?.message?.interaction?.commandName?.split(' ')?.[0],
    command => command.onSelect(interaction),
  ),
};

const onListener = async (interaction, commandName, onListener) => {
  const command = interaction.client.commands.get(commandName);

  if (!command) {
    await audit({
      guildId: null,
      type: TYPES.WARNING,
      category: CATEGORIES.LISTENER,
      message: t('inner:audit.onListener.lost', {commandName}),
    });
    return;
  }

  try {
    await onListener(command);
  } catch (e) {
    await audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.LISTENER,
      message: stringify(e),
    });
  }
};
