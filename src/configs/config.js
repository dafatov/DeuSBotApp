//const configLocal = require('./config.local.js')

module.exports =
{
    // "token" : configLocal.token,
    // "cookie": configLocal.cookie,
    // "database": configLocal.database,

    "token" : process.env.token,
    "cookie": process.env.cookie,
    "database": process.env.DATABASE_URL,
    
    "logesPath": "logs",

    "colors": {
        "info": "#FFFF50",
        "warning": "#FF8800",
        "error": "#FF0000"
    }
}