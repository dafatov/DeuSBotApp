const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');

const rules = new Map();

module.exports.getAll = async guildId => {
  if (!rules.has(guildId)) {
    const response = await db.query('SELECT regex, react FROM response WHERE guild_id=$1', [guildId]);
    rules.set(guildId, response.rows || []);
  }
  return rules.get(guildId);
};

module.exports.set = async (guildId, {regex, react}) => {
  await transaction(async () => {
    await this.remove(guildId, regex);
    await db.query('INSERT INTO response (guild_id, regex, react) VALUES ($1, $2, $3)', [guildId, regex, react]);
  });
};

module.exports.remove = async (guildId, regex) => {
  rules.delete(guildId);
  await db.query('DELETE FROM response WHERE guild_id=$1 AND regex=$2', [guildId, regex]);
};

module.exports.count = async () => {
  return await db.query('SELECT guild_id, count(*) FROM response GROUP BY guild_id');
};

module.exports.clearCache = () => {
  rules.clear();
  return true;
};
