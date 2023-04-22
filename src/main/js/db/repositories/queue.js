const {db} = require('../../actions/db');
const format = require('pg-format');
const {transaction} = require('../dbUtils');

module.exports.TYPES = Object.freeze({
  RADIO: 'radio',
  YOUTUBE: 'youtube',
});

module.exports.getAll = async guildId => {
  const rows = (await db.query('SELECT * FROM queue WHERE guild_id=$1', [guildId])).rows ?? [];

  return rows.map(row => ({...row, guildId: row.guild_id, userId: row.user_id, isLive: row.is_live}));
};

module.exports.getCount = async guildId => {
  return (await db.query('SELECT count(*)::integer AS count FROM queue WHERE guild_id=$1', [guildId])).rows[0].count ?? 0;
};

module.exports.getDuration = async guildId => {
  return (await db.query('SELECT sum(duration)::integer AS duration FROM queue WHERE guild_id=$1', [guildId])).rows[0].duration ?? 0;
};

module.exports.addAll = async (guildId, songs) => {
  await transaction(async () => {
    const startIndex = (await db.query('SELECT max(index) + 1 AS index FROM queue')).rows[0].index ?? 0;

    await db.query(format(
      'INSERT INTO queue (type, title, duration, url, is_live, preview, user_id, index, guild_id) VALUES %L',
      songs.map(({type, title, duration, url, isLive, preview, userId}, index) =>
        [type, title, duration, url, isLive, preview, userId, startIndex + index, guildId]),
    ));
  });
};

module.exports.remove = async (guildId, index) => {
  return await transaction(async () => {
    const target = (await db.query('DELETE FROM queue WHERE guild_id=$1 AND index=$2 RETURNING *', [guildId, index])).rows[0];

    await db.query('UPDATE queue SET index = index - 1 WHERE guild_id=$1 AND index>$2', [guildId, target.index]);

    return {...target, guildId: target.guild_id, userId: target.user_id, isLive: target.is_live};
  });
};

module.exports.removeAll = async guildId => {
  await db.query('DELETE FROM queue WHERE guild_id=$1', [guildId]);
};

module.exports.move = async (guildId, targetIndex, positionIndex) => {
  return await transaction(async () => {
    await db.query('UPDATE queue SET index = index + 1 WHERE guild_id=$1 AND index>=$2', [
      guildId, positionIndex + (targetIndex < positionIndex),
    ]);

    const target = (await db.query('UPDATE queue SET index = $1 WHERE guild_id=$2 AND index=$3 RETURNING *', [
      positionIndex + (targetIndex < positionIndex), guildId, targetIndex + (targetIndex > positionIndex),
    ])).rows[0];

    await db.query('UPDATE queue SET index = index - 1 WHERE guild_id=$1 AND index>$2', [guildId, targetIndex]);

    return {...target, guildId: target.guild_id, userId: target.user_id, isLive: target.is_live};
  });
};

module.exports.shuffle = async guildId => {
  return await transaction(async () => {
    const data = (await db.query('SELECT * FROM queue WHERE guild_id=$1 ORDER BY random()', [guildId])).rows;

    await db.query(format(
      'INSERT INTO queue (id, type, title, duration, url, is_live, preview, user_id, index, guild_id) VALUES %L ON CONFLICT (id) DO UPDATE SET INDEX = excluded.index',
      data.map(({id, type, title, duration, url, is_live, preview, user_id, guild_id}, index) =>
        [id, type, title, duration, url, is_live, preview, user_id, index, guild_id]),
    ));
  });
};
