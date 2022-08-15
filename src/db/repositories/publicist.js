const {db} = require('../../actions/db');
let newsChannels;

module.exports.getAll = async () => {
  if (!newsChannels) {
    const response = await db.query('SELECT * FROM PUBLICIST');
    newsChannels = response.rows.map(r =>
      ({guildId: r.guild_id, channelId: r.channel_id})) || [];
  }
  return newsChannels;
}

module.exports.set = async (guildId, channelId) => {
  await this.delete(guildId);
  await db.query('INSERT INTO PUBLICIST (guild_id, channel_id) VALUES ($1, $2)', [guildId, channelId]);
}

module.exports.delete = async (guildId) => {
  newsChannels = null;
  await db.query('DELETE FROM PUBLICIST WHERE guild_id=$1', [guildId]);
}
