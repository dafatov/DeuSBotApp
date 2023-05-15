const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');

let session;

module.exports.getAll = async () => {
  if (!session) {
    const response = await db.query(`SELECT *, date_trunc('milliseconds', finish) - date_trunc('milliseconds', begin) AS duration
                                         FROM session`);
    session = response.rows || [];
  }
  return session;
};

module.exports.begin = async (userId, guildId) => await transaction(async () => {
  await remove(userId, guildId);
  await db.query('INSERT INTO session (user_id, guild_id, begin, finish) VALUES ($1, $2, DEFAULT, NULL)', [userId, guildId]);
});

module.exports.finish = (userId, guildId) => {
  this.clearCache();
  return db.query('UPDATE session SET finish = DEFAULT WHERE user_id=$1 AND guild_id=$2 RETURNING *', [userId, guildId]);
};

const remove = async (userId, guildId) => {
  this.clearCache();
  await db.query('DELETE FROM session WHERE user_id=$1 AND guild_id=$2', [userId, guildId]);
};

module.exports.clearCache = () => {
  session = null;
  return true;
};
