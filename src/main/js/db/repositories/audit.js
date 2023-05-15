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
  COMMAND: 'command',
  STATE_UPDATE: 'state_update',
  SECURITY: 'security',
  RESPONSE: 'response',
  PUBLICIST: 'publicist',
  LISTENER: 'listener',
  LOCALE: 'locale',
  RADIO: 'radio',
  MESSAGE_CREATE: 'message_create',
  MODAL: 'modal',
});

let audit = null;

module.exports.getAll = async () => {
  if (!audit) {
    const response = await db().query('SELECT * FROM audit');
    audit = response.rows || [];
  }
  return audit;
};

module.exports.add = async ({guildId, type, category, message}) => {
  this.clearCache();
  await db().query(
    'INSERT INTO audit (guild_id, type, category, message) VALUES ($1, $2, $3, $4)',
    [guildId, type, category, message],
  );
};

/**
 * Удаляет все записи до события вычтенного из текущего времени и смещения
 * @param offset
 * @example  "6Y5M4DT3H2M1S"
 * @example  "1M"
 * @example  "T1M"
 * @returns {Promise<void>}
 */
module.exports.removeBeforeWithOffset = async offset => {
  this.clearCache();
  return await db().query('DELETE FROM audit WHERE created_at < (current_timestamp - INTERVAL \'P$1\')', [offset]);
};

module.exports.clearCache = () => {
  audit = null;
  return true;
};
