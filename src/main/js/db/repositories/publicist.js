const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');

let newsChannels;

module.exports.getAll = async () => {
  if (!newsChannels) {
    const response = await db.query('SELECT * FROM publicist');
    newsChannels = response.rows.map(r =>
      ({guildId: r.guild_id, channelId: r.channel_id})) || [];
  }
  return newsChannels;
};

module.exports.set = async (guildId, channelId) => {
  await transaction(async () => {
    await this.remove(guildId);
    await db.query('INSERT INTO publicist (guild_id, channel_id) VALUES ($1, $2)', [guildId, channelId]);
  });
};

module.exports.remove = async guildId => {
  this.clearCache();
  await db.query('DELETE FROM publicist WHERE guild_id=$1', [guildId]);
};

module.exports.clearCache = () => {
  newsChannels = null;
  return true;
};
