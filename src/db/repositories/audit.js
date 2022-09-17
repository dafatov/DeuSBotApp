// Необходимо так из-за того, что не успевает проинициализироваться весь файл /db,
//   чтобы значение уже было, поэтому нужно импортировать принудительно через функцию
const db = () => require('../../actions/db').db;

module.exports.TYPES = Object.freeze({
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DEBUG: 'debug',
});
module.exports.CATEGORIES = Object.freeze({
  PLAYER: 'player',
  UNCATEGORIZED: 'uncategorized',
  INIT: 'init',
  AUDITOR: 'auditor',
  DATABASE: 'database',
  PERMISSION: 'permission',
  API: 'api',
});

let audit = null;

module.exports.getAll = async () => {
  if (!audit) {
    const response = await db().query('SELECT * FROM AUDIT');
    audit = response.rows || [];
  }
  return audit;
};

module.exports.add = async ({guildId, type, category, message}) => {
  audit = null;
  await db().query(
    'INSERT INTO AUDIT (guild_id, type, category, message) VALUES ($1, $2, $3, $4)',
    [guildId, type, category, message],
  );
}

/**
 * Удаляет все записи до события вычтенного из текущего времени и смещения
 * @param offset
 * @example  "6Y5M4DT3H2M1S"
 * @example  "1M"
 * @example  "T1M"
 * @returns {Promise<void>}
 */
module.exports.removeBeforeWithOffset = async (offset) => {
  audit = null;
  return await db().query(`DELETE
                           FROM AUDIT
                           WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL 'P${offset}')`);
}
