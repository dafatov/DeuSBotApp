const { db } = require("../db.js");

let rules = null;

module.exports.getAll = async () => {
    if (!rules) {
        const response = await db.query('SELECT * FROM RESPONSE');
        rules = response.rows || [];
    }
    return rules;
}

module.exports.set = async ({regex, react}) => {
    rules = null;
    await db.query('DELETE FROM RESPONSE WHERE regex=$1', [regex]);
    await db.query('INSERT INTO RESPONSE (regex, react) VALUES ($1, $2)', [regex, react]);
}

module.exports.delete = async (regex) => {
    rules = null;
    await db.query('DELETE FROM RESPONSE WHERE regex=$1', [regex]);
}

module.exports.count = async () => {
    const response = await db.query('SELECT COUNT(*) FROM RESPONSE');
    return parseInt(response.rows[0].count);
}