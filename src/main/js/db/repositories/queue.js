const {backup} = require('./snapshots');
const {db} = require('../../actions/db');
const format = require('pg-format');
const {getCommandName} = require('../../utils/string');
const {transaction} = require('../dbUtils');

module.exports.TYPES = Object.freeze({
  RADIO: 'radio',
  YOUTUBE: 'youtube',
  FILE: 'file',
});

module.exports.getAll = async guildId => {
  const rows = (await db.query('SELECT * FROM queue WHERE guild_id=$1', [guildId])).rows ?? [];

  return rows.map(row => ({...row, guildId: row.guild_id, userId: row.user_id, isLive: row.is_live}));
};

module.exports.get = async id => {
  const row = (await db.query('SELECT * FROM queue WHERE id=$1', [id])).rows?.[0];

  return row
    ? {...row, guildId: row.guild_id, userId: row.user_id, isLive: row.is_live}
    : row;
};

module.exports.getPage = async (guildId, start, finish) => {
  const rows = (await db.query('SELECT * FROM queue WHERE guild_id=$1 AND index >= $2 AND index < $3', [guildId, start, finish])).rows ?? [];

  return rows.map(row => ({...row, guildId: row.guild_id, userId: row.user_id, isLive: row.is_live}));
};

module.exports.getCount = async guildId => {
  return (await db.query('SELECT count(*)::integer AS count FROM queue WHERE guild_id=$1', [guildId])).rows[0].count ?? 0;
};

module.exports.getDuration = async guildId => {
  return (await db.query('SELECT sum(duration)::integer AS duration FROM queue WHERE guild_id=$1', [guildId])).rows[0].duration ?? 0;
};

module.exports.addAll = async (guildId, songs) => {
  return await transaction(async () => {
    const startIndex = (await db.query('SELECT max(index) + 1 AS index FROM queue')).rows[0].index ?? 0;

    await backup(getCommandName(__filename), guildId);
    return (await db.query(format(
      'INSERT INTO queue (type, title, duration, url, is_live, preview, user_id, index, guild_id) VALUES %L RETURNING id',
      songs.map(({type, title, duration, url, isLive, preview, userId}, index) =>
        [type, title, duration, url, isLive, preview, userId, startIndex + index, guildId]),
    ))).rows.map(row => row.id);
  });
};

module.exports.remove = async (guildId, index) => {
  return await transaction(async () => {
    await backup(getCommandName(__filename), guildId);

    const target = (await db.query('DELETE FROM queue WHERE guild_id=$1 AND index=$2 RETURNING *', [guildId, index])).rows[0];

    await db.query('UPDATE queue SET index = index - 1 WHERE guild_id=$1 AND index>$2', [guildId, target.index]);

    return {...target, guildId: target.guild_id, userId: target.user_id, isLive: target.is_live};
  });
};

module.exports.removeAll = guildId =>
  transaction(async () => {
    await backup(getCommandName(__filename), guildId);
    await db.query('DELETE FROM queue WHERE guild_id=$1', [guildId]);
  });

module.exports.move = async (guildId, targetIndex, positionIndex) => {
  return await transaction(async () => {
    await backup(getCommandName(__filename), guildId);
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

    await backup(getCommandName(__filename), guildId);
    await db.query(format(
      'INSERT INTO queue (id, type, title, duration, url, is_live, preview, user_id, index, guild_id) VALUES %L ON CONFLICT (id) DO UPDATE SET INDEX = excluded.index',
      data.map(({id, type, title, duration, url, is_live, preview, user_id, guild_id}, index) =>
        [id, type, title, duration, url, is_live, preview, user_id, index, guild_id]),
    ));
  });
};

module.exports.hasLive = async guildId => {
  return (await db.query('SELECT count(*) != 0 AS has_live FROM queue WHERE guild_id=$1 AND is_live', [guildId])).rows[0].has_live ?? false;
};
