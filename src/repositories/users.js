const { db } = require("../db.js");

let users = null;

module.exports.getAll = async () => {
    if (!users) {
        const response = await db.query('SELECT * FROM NICKNAME');
        users = response.rows || [];
    }
    return users;
}

module.exports.set = async ({login, nickname}) => {
    users = null;
    await db.query('DELETE FROM NICKNAME WHERE login=$1', [login]);
    await db.query('INSERT INTO NICKNAME (login, nickname) VALUES ($1, $2)', [login, nickname]);
}

module.exports.deleteByLogin = async (login) => {
    users = null;
    await db.query('DELETE FROM NICKNAME WHERE login=$1', [login]);
}

module.exports.deleteByNickname = async (nickname) => {
    users = null;
    await db.query('DELETE FROM NICKNAME WHERE nickname=$1', [nickname]);
}