const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');

let session;

module.exports.getAll = async () => {
  if (!session) {
    const response = await db.query('SELECT * FROM SESSION');
    session = response.rows || [];
  }
  return session;
};

module.exports.begin = (userId, guildId) => transaction(async () => {
  await remove(userId, guildId);
  await db.query('INSERT INTO SESSION (user_id, guild_id, begin, finish) VALUES ($1, $2, DEFAULT, null)', [userId, guildId]);
});

module.exports.finish = async (userId, guildId) => {
  session = null;
  return await db.query('UPDATE SESSION SET FINISH = DEFAULT WHERE user_id=$1 AND guild_id=$2 RETURNING *', [userId, guildId]);
};

const remove = async (userId, guildId) => {
  session = null;
  await db.query('DELETE FROM SESSION WHERE user_id=$1 AND guild_id=$2', [userId, guildId]);
};
