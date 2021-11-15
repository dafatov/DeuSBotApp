const { Client } = require('pg');
const config = require('../configs/config');
const { log } = require('../utils/logger');

let rules = null;

const client = new Client({
    connectionString: config.database,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports.init = async () => {
    await client.connect().then(() => log('Успешно подключена база данных'));
}

module.exports.getAll = async () => {
    if (!rules) {
        const response = await client.query('SELECT * FROM RESPONSE');
        rules = response.rows || [];
    }
    return rules;
}

module.exports.set = async ({regex, react}) => {
    rules = null;
    await client.query('DELETE FROM RESPONSE WHERE regex=$1', [regex]);
    await client.query('INSERT INTO RESPONSE (regex, react) VALUES ($1, $2)', [regex, react]);
}

module.exports.delete = async (regex) => {
    rules = null;
    await client.query('DELETE FROM RESPONSE WHERE regex=$1', [regex]);
}

module.exports.count = async () => {
    const response = await client.query('SELECT COUNT(*) FROM RESPONSE');
    return parseInt(response.rows[0].count);
}