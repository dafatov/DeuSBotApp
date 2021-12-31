const {db} = require("../actions/db");

let variables

module.exports.getAll = async () => {
  if (!variables) {
    const response = await db.query('SELECT * FROM VARIABLES');
    variables = response.rows
      .reduce((obj, item) => ({...obj, [item.key]: item.value}), {});
  }
  return variables;
}

module.exports.set = async (key, value) => {
  await this.delete(key);
  await db.query('INSERT INTO VARIABLES (key, value) VALUES ($1, $2)', [key, value]);
}

module.exports.delete = async (key) => {
  variables = null;
  await db.query('DELETE FROM VARIABLES WHERE key=$1', [key]);
}