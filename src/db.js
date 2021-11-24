const { Client } = require('pg');
const config = require('./configs/config.js');
const { log, error } = require('./utils/logger.js');

const getNewClient = () => {
    return new Client({
        connectionString: config.database,
        ssl: {
            rejectUnauthorized: false
    }});
}

module.exports.db = getNewClient();

module.exports.init = async () => {
    await module.exports.db.connect().then(() => log('Успешно подключена база данных'));
}

module.exports.db.on('error', async (err) => {
    error(err);
    module.exports.db = getNewClient();
    await module.exports.init();
})
