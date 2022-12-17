const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

let client;

module.exports.init = c => {
  client = c;
};

module.exports.execute = async interaction => {
  const commandName = interaction?.message?.interaction?.commandName;
  const command = client.commands.get(commandName?.split(' ')?.[0]);

  if (!command) {
    await audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.LISTENER,
      message: t('inner:audit.listener.lost', {commandName}),
    });

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
