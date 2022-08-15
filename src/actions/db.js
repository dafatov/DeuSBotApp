const {Client} = require('pg');
const {audit} = require('./auditor');
const {migrate} = require('postgres-migrations');
const {TYPES, CATEGORIES} = require('../db/repositories/audit');

const getNewClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PROFILE === 'DEV'
      ? false
      : {
        rejectUnauthorized: false,
      },
  });
}

module.exports.db = getNewClient();

module.exports.init = async () => {
  await this.db.connect()
    .then(() => migrate({client: this.db}, 'src/db/migrations', {
      logger: async message => await audit({
        guildId: null,
        type: TYPES.DEBUG,
        category: CATEGORIES.DATABASE,
        message,
      }),
    })).then(() => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.INIT,
      message: 'Успешно загружена база данных',
    })).catch(() => {});
}

module.exports.db.on('error', async (err) => {
  module.exports.db = getNewClient();
  await module.exports.init().then(() => audit({
    guildId: null,
    type: TYPES.ERROR,
    category: CATEGORIES.DATABASE,
    message: err,
  }));
});
