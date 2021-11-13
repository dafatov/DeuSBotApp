const { Client } = require('pg');
const config = require('../configs/config');
const { log } = require('../utils/logger');

const client = new Client({
    connectionString: config.database,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports.init = async () => {
    await client.connect().then(() => log('Успешно подключена база данных'));
}

module.exports.getAll = () => {
    return client.query('SELECT * FROM RESPONSE')
        .then(response => response.rows || [])
}

module.exports.set = ({regex, react}) => {
    return client.query('DELETE FROM RESPONSE WHERE regex=$1', [regex])
        .then(() => client.query('INSERT INTO RESPONSE (regex, react) VALUES ($1, $2)', [regex, react]));
}

module.exports.delete = (regex) => {
    return client.query('DELETE FROM RESPONSE WHERE regex=$1', [regex]);
}

module.exports.count = () => {
    return client.query('SELECT COUNT(*) FROM RESPONSE')
        .then(response => parseInt(response.rows[0].count));
}