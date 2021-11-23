// const configLocal = require('./config.local.js')

module.exports =
{
    // "token" : configLocal.token,
    // "cookie": configLocal.cookie,
    // "database": configLocal.database,
    // "randomOrgToken": configLocal.randomOrgToken,
    // "version" : "<debug>",

    "token" : process.env.token,
    "cookie": process.env.cookie,
    "database": process.env.DATABASE_URL,
    "randomOrgToken": process.env.randomOrgToken,
    "version" : process.env.HEROKU_RELEASE_VERSION,

    "colors": {
        "info": "#FFFF50",
        "warning": "#FF8800",
        "error": "#FF0000",
    },
}