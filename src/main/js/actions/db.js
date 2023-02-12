const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {Client} = require('pg');
const {audit} = require('./auditor');
const {migrate} = require('postgres-migrations');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

const getNewClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PROFILE === 'DEV'
      ? false
      : {
        rejectUnauthorized: false,
      },
  });
};

module.exports.db = getNewClient();

module.exports.init = async () => {
  await this.db.connect()
    .then(() => migrate({client: this.db}, 'src/main/js/db/migrations', process.env.LOGGING === 'DEBUG'
      // eslint-disable-next-line no-console
      ? {logger: console.log}
      : {}))
    .then(() => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.INIT,
      message: t('inner:audit.init.database'),
    })).catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.DATABASE,
      message: stringify(e),
    }));
};

module.exports.db.on('error', async e => {
  module.exports.db = getNewClient();
  await module.exports.init().then(() => audit({
    guildId: null,
    type: TYPES.ERROR,
    category: CATEGORIES.DATABASE,
    message: stringify(e),
  }));
});
