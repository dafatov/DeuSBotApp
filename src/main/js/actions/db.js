const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {Pool} = require('pg');
const {audit} = require('./auditor');
const {migrate} = require('postgres-migrations');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

const getNewPool = () => new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DATABASE_MAX_CONNECTIONS ?? 1),
  idleTimeoutMillis: 10000,
});

const getMigrateParams = () => {
  const config = {};

  if (process.env.LOGGING === 'DEBUG') {
    // eslint-disable-next-line no-console
    config.logger = console.log;
  }

  return [
    'src/main/js/db/migrations',
    config,
  ];
};

module.exports.db = getNewPool();

module.exports.init = () => this.db.connect()
  .then(client => migrate({client}, ...getMigrateParams()))
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

module.exports.db.on('error', async e => {
  module.exports.db = getNewPool();
  await module.exports.init().then(() => audit({
    guildId: null,
    type: TYPES.WARNING,
    category: CATEGORIES.DATABASE,
    message: stringify(e),
  }));
});
