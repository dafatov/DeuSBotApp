const {db} = require('../../actions/db');

let statistics;

module.exports.getAll = async () => {
  if (!statistics) {
    const response = await db.query('SELECT * FROM STATISTICS');
    statistics = response.rows || [];
  }
  return statistics;
};

module.exports.update = async (userId, guildId, {messageCount, voiceDuration}) => {
  statistics = null;
  await db.query(
    `INSERT INTO STATISTICS (user_id, guild_id, message_count, voice_duration)
     VALUES ($1, $2, $3, $5::TIMESTAMP WITH TIME ZONE - $4::TIMESTAMP WITH TIME ZONE)
     ON CONFLICT (user_id, guild_id) DO UPDATE SET (MESSAGE_COUNT, VOICE_DURATION) = ((SELECT MESSAGE_COUNT FROM STATISTICS WHERE user_id = $1 AND guild_id = $2) + $3,
                                                                                      (SELECT VOICE_DURATION FROM STATISTICS WHERE user_id = $1 AND guild_id = $2) +
                                                                                      ($5::TIMESTAMP WITH TIME ZONE - $4::TIMESTAMP WITH TIME ZONE))`,
    [
      userId, guildId, messageCount ?? 0,
      voiceDuration?.begin ?? new Date(0),
      voiceDuration?.finish ?? new Date(0),
    ],
  );
};
