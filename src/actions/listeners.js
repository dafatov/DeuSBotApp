const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

let client;

module.exports.init = c => {
  client = c;
};

module.exports.execute = async interaction => {
  if (!interaction || !interaction.message || !interaction.message.interaction
    || !interaction.message.interaction.commandName) {
    await audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.LISTENER,
      message: t('inner:audit.listener.lost'),
    });
    return;
  }
  const command = client.commands.get(interaction.message.interaction.commandName);

  if (!command) {
    return;
  }
  try {
    await command.listener(interaction);
  } catch (e) {
    await audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.LISTENER,
      message: stringify(e),
    });
  }
};
