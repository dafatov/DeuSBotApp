//const configLocal = require('./config.local.js')

module.exports =
{
    // "token" : configLocal.token,
    // "cookie": configLocal.cookie,
    // "database": configLocal.database,

    "token" : process.env.token,
    "cookie": process.env.cookie,
    "database": process.env.DATABASE_URL,
    
    "logesPath": "logs"
}