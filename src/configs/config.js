//const configLocal = require('./config.local.js')

module.exports =
{
    //"token" : configLocal.token,
    "token" : process.env.token,
    //"cookie": configLocal.cookie,
    "cookie": process.env.cookie,
    //"database": configLocal.database,
    "database": process.env.DATABASE_URL,
    
    "logesPath": "logs"
}