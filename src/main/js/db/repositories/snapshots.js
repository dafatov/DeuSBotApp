const {DISCORD_OPTIONS_MAX} = require('../../utils/constants');
const {db} = require('../../actions/db');
const format = require('pg-format');
const {transaction} = require('../dbUtils');

let snapshots = null;

module.exports.getAll = async () => {
  if (!snapshots) {
    const response = await db.query('SELECT id, guild_id, date, "table" FROM snapshots');
    snapshots = response.rows ?? [];
  }
  return snapshots.map(snapshot => ({...snapshot, date: new Date(snapshot.date), guildId: snapshot.guild_id}));
};

module.exports.backup = (table, guildId) =>
  transaction(async () => {
    const hasGuildId = await this.getHasGuildId(table);

    if ((!hasGuildId || !guildId) && (hasGuildId || guildId)) {
      throw new Error(`Can't backup table (${table}, ${guildId}): may lose data`);
    }

    this.clearCache();
    await db.query(format(
      `WITH current AS (SELECT coalesce(json_agg("${table}"), '[]'::json)::jsonb AS data
                            FROM "${table}"%s),
            existing AS (SELECT id, "table", snapshots.data, guild_id
                             FROM current,
                                  snapshots
                             WHERE "table" = '${table}'%s
                               AND snapshots.data <@ current.data
                               AND snapshots.data @> current.data)
       INSERT
           INTO snapshots (id, "table", data, guild_id)
       SELECT *
           FROM existing
       UNION
       SELECT nextval(pg_get_serial_sequence('snapshots', 'id')), '${table}', current.data, $1
           FROM current
           LIMIT 1
       ON CONFLICT (id) DO UPDATE SET date = DEFAULT`,
      hasGuildId && guildId
        ? ` WHERE ${table}.guild_id::varchar = ${guildId}::varchar`
        : '',
      hasGuildId && guildId
        ? ` AND snapshots.guild_id::varchar = ${guildId}::varchar`
        : '',
    ), [guildId]);
    await removeMoreThanMax(table, guildId);
  });

module.exports.restore = id =>
  transaction(async () => {
    const {guildId, table, date} = (await this.getAll()).find(snapshot => snapshot.id === id);
    const hasGuildId = await this.getHasGuildId(table);

    if ((!hasGuildId || !guildId) && (hasGuildId || guildId)) {
      throw new Error('Can\'t restore table: may lose data');
    }

    await db.query(format(
      `DELETE
           FROM ${table}%s`,
      hasGuildId && guildId
        ? ` WHERE ${table}.guild_id = ${guildId}`
        : '',
    ));
    await db.query(`INSERT INTO ${table}
                           SELECT records.*
                               FROM snapshots,
                                    jsonb_populate_recordset(NULL::${table}, snapshots.data) AS records
                               WHERE snapshots.id = $1`, [id]);
    return {table, date};
  });

module.exports.clearCache = () => {
  snapshots = null;
  return true;
};

module.exports.getHasGuildId = table =>
  db.query(`SELECT exists(SELECT 1
                              FROM information_schema.columns
                              WHERE table_name = '${table}'
                                AND column_name = 'guild_id') AS col_exists`)
    .then(response => response.rows[0].col_exists ?? false);

const removeMoreThanMax = (table, guildId) =>
  db.query(format(
    `DELETE
         FROM snapshots
         WHERE id IN (SELECT id
                          FROM snapshots
                          WHERE "table" = '${table}'%s
                          ORDER BY date DESC
                          OFFSET $1)`,
    guildId
      ? ` AND guild_id = ${guildId}`
      : '',
  ), [DISCORD_OPTIONS_MAX]);
