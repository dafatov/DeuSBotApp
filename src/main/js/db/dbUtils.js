const {db} = require('../actions/db');

module.exports.transaction = async callback => {
  try {
    await db.query('BEGIN');
    const result = await callback();
    await db.query('COMMIT');
    return result;
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
};
