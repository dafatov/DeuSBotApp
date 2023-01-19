const {db} = require('../../actions/db');

let statistics;

module.exports.getAll = async () => {
  if (!statistics) {
    const response = await db.query('SELECT * FROM STATISTICS');
    statistics = response.rows || [];
  }
  return statistics;
};

module.exports.update = (userId, {messageCount, voiceDuration}) => db.query(
  'INSERT INTO STATISTICS VALUES ($1, $2, $4::TIMESTAMP WITH TIME ZONE - $3::TIMESTAMP WITH TIME ZONE) '
  + 'ON CONFLICT (user_id) DO UPDATE SET (MESSAGE_COUNT, VOICE_DURATION) = ('
  + '(SELECT MESSAGE_COUNT FROM STATISTICS WHERE user_id=$1)'
  + ' + $2, '
  + '(SELECT VOICE_DURATION FROM STATISTICS WHERE user_id=$1)'
  + ' + ($4::TIMESTAMP WITH TIME ZONE - $3::TIMESTAMP WITH TIME ZONE)'
  + ')',
  [
    userId, messageCount ?? 0,
    voiceDuration?.begin ?? new Date(0),
    voiceDuration?.finish ?? new Date(0),
  ],
);
