const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('../actions/auditor');
const fs = require('fs');
const {stringify} = require('../utils/string');

module.exports.execute = (client, message) =>
  Promise.all(fs.readdirSync('./src/events/messageCreate')
    .filter(f => !f.startsWith('_'))
    .filter(f => f.endsWith('.js'))
    .map(f => require(`./messageCreate/${f}`))
    .map(event => event.execute({client, message})))
    .catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.MESSAGE_CREATE,
      message: stringify(e),
    }));
