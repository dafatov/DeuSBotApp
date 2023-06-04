const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {backup, getHasGuildId} = require('../db/repositories/snapshots');
const {audit} = require('./auditor');
const fs = require('fs');
const {t} = require('i18next');

module.exports.init = client =>
  Promise.all(fs.readdirSync('./src/main/js/db/repositories')
    .filter(fileName => fileName.endsWith('.js'))
    .map(fileName => fileName.split('.')[0])
    .filter(fileName => !['audit', 'snapshots'].includes(fileName))
    .map(async table => {
      if (await getHasGuildId(table)) {
        return client.guilds.fetch()
          .then(guilds => Promise.all(guilds.map(({id}) => backup(table, id))));
      } else {
        return backup(table);
      }
    }))
    .then(() => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.BACKUP,
      message: t('inner:audit.init.backup'),
    }));
