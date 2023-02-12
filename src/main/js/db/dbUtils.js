const {db} = require('../actions/db');

module.exports.transaction = async callback => {
  try {
    await db.query('BEGIN');
    await callback();
    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }
};
