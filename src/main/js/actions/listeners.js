const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

module.exports = {
  onButton: async interaction => {
    const commandName = interaction?.message?.interaction?.commandName;
    const command = interaction.client.commands.get(commandName?.split(' ')?.[0]);

    if (!command) {
      await audit({
        guildId: null,
        type: TYPES.WARNING,
        category: CATEGORIES.LISTENER,
        message: t('inner:audit.onButton.lost', {commandName}),
      });
      return;
    }

    try {
      await command.onButton(interaction);
    } catch (e) {
      await audit({
        guildId: null,
        type: TYPES.ERROR,
        category: CATEGORIES.LISTENER,
        message: stringify(e),
      });
    }
  },
  onModal: async interaction => {
    const command = interaction.client.commands.get(interaction?.customId);

    if (!command) {
      await audit({
        guildId: null,
        type: TYPES.WARNING,
        category: CATEGORIES.LISTENER,
        message: t('inner:audit.onModal.lost', {commandName: interaction?.customId}),
      });
      return;
    }

    try {
      await command.onModal(interaction);
    } catch (e) {
      await audit({
        guildId: null,
        type: TYPES.ERROR,
        category: CATEGORIES.LISTENER,
        message: stringify(e),
      });
    }
  },
  onSelect: async interaction => {
    const commandName = interaction?.message?.interaction?.commandName;
    const command = interaction.client.commands.get(commandName?.split(' ')?.[0]);

    if (!command) {
      await audit({
        guildId: null,
        type: TYPES.WARNING,
        category: CATEGORIES.LISTENER,
        message: t('inner:audit.onSelect.lost', {commandName}),
      });
      return;
    }

    try {
      await command.onSelect(interaction);
    } catch (e) {
      await audit({
        guildId: null,
        type: TYPES.ERROR,
        category: CATEGORIES.LISTENER,
        message: stringify(e),
      });
    }
  }
};
