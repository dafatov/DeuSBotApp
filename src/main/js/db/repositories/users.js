const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');

let users = null;

module.exports.getAll = async () => {
  if (!users) {
    const response = await db.query('SELECT * FROM NICKNAME');
    users = response.rows || [];
  }
  return users;
};

module.exports.set = async ({login, nickname}) => {
  await transaction(async () => {
    users = null;
    await db.query('DELETE FROM NICKNAME WHERE login=$1', [login]);
    await db.query('INSERT INTO NICKNAME (login, nickname) VALUES ($1, $2)', [login, nickname]);
  });
};

module.exports.removeByLogin = async login => {
  users = null;
  await db.query('DELETE FROM NICKNAME WHERE login=$1', [login]);
};
