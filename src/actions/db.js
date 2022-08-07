const {Client} = require('pg');
const {audit, TYPES, CATEGORIES} = require("./auditor");

const getNewClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

module.exports.db = getNewClient();

module.exports.init = async () => {
  await module.exports.db.connect().then(() => audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: 'Успешно подключена база данных'
  }));
}

module.exports.db.on('error', async (err) => {
  module.exports.db = getNewClient();
  await module.exports.init().then(() => audit({
    guildId: null,
    type: TYPES.ERROR,
    category: CATEGORIES.UNCATEGORIZED,
    message: err
  }));
})
