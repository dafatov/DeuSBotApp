const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');

let users = null;

module.exports.getAll = async () => {
  if (!users) {
    const response = await db.query('SELECT * FROM "user"');
    users = response.rows || [];
  }
  return users;
};

module.exports.set = async ({login, nickname}) => {
  this.clearCache();
  await transaction(async () => {
    await db.query('DELETE FROM "user" WHERE login=$1', [login]);
    await db.query('INSERT INTO "user" (login, nickname) VALUES ($1, $2)', [login, nickname]);
  });
};

module.exports.removeByLogin = async login => {
  this.clearCache();
  await db.query('DELETE FROM "user" WHERE login=$1', [login]);
};

module.exports.clearCache = () => {
  users = null;
  return true;
};
