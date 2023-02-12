const {db} = require('../../actions/db');

let statistics;

module.exports.getAll = async () => {
  if (!statistics) {
    const response = await db.query('SELECT * FROM statistics');
    statistics = response.rows || [];
  }
  return statistics;
};

module.exports.update = async (userId, guildId, {messageCount, voiceDuration}) => {
  statistics = null;
  await db.query(
    `INSERT INTO statistics (user_id, guild_id, message_count, voice_duration)
         VALUES ($1, $2, $3, justify_interval($5::timestamp WITH TIME ZONE - $4::timestamp WITH TIME ZONE))
     ON CONFLICT (user_id, guild_id) DO UPDATE SET message_count  = (SELECT message_count FROM statistics WHERE user_id = $1 AND guild_id = $2) + $3,
                                                   voice_duration = justify_interval(
                                                               (SELECT voice_duration FROM statistics WHERE user_id = $1 AND guild_id = $2) +
                                                               ($5::timestamp WITH TIME ZONE - $4::timestamp WITH TIME ZONE))`,
    [
      userId, guildId, messageCount ?? 0,
      voiceDuration?.begin ?? new Date(0),
      voiceDuration?.finish ?? new Date(0),
    ],
  );
};
