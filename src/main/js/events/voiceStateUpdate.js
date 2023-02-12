const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('../actions/auditor');
const fs = require('fs');
const {stringify} = require('../utils/string');

module.exports.execute = (client, oldState, newState) =>
  Promise.all(fs.readdirSync('./src/main/js/events/voiceStateUpdate')
    .filter(f => !f.startsWith('_'))
    .filter(f => f.endsWith('.js'))
    .map(f => require(`./voiceStateUpdate/${f}`))
    .map(event => event.execute({client, oldState, newState})))
    .catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.STATE_UPDATE,
      message: stringify(e),
    }));
