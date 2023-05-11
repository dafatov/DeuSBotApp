const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

module.exports.execute = async interaction => {
  const command = interaction.client.commands.get(interaction?.customId);

  if (!command) {
    await audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.MODAL,
      message: t('inner:audit.modal.lost', {commandName: interaction?.customId}),
    });
    return;
  }

  try {
    await command.modal(interaction);
  } catch (e) {
    await audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.MODAL,
      message: stringify(e),
    });
  }
};
