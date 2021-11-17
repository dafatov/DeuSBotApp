const { Client } = require('pg');
const config = require('./configs/config.js');
const { log } = require('./utils/logger.js');


module.exports.db = new Client({
    connectionString: config.database,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports.init = async () => {
    await module.exports.db.connect().then(() => log('Успешно подключена база данных'));
}