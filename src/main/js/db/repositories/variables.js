const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');

let variables;

module.exports.getAll = async () => {
  if (!variables) {
    const response = await db.query('SELECT * FROM variables');
    variables = response.rows
      .reduce((obj, item) => ({...obj, [item.key]: item.value}), {});
  }
  return variables;
};

module.exports.set = async (key, value) => {
  this.clearCache();
  await transaction(async () => {
    await db.query('DELETE FROM variables WHERE key=$1', [key]);
    await db.query('INSERT INTO variables (key, value) VALUES ($1, $2)', [key, value]);
  });
};

module.exports.clearCache = () => {
  variables = null;
  return true;
};
