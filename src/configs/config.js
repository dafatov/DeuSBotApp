//const configLocal = require('./config.local.js')

module.exports = {
    // "discordToken": configLocal.discordToken,
    // "cookie": configLocal.cookie,
    // "database": configLocal.database,
    // "randomOrgToken": configLocal.randomOrgToken,
    // "githubToken": configLocal.githubToken,
    // "githubLogin": configLocal.githubLogin,
    // "githubRepository": configLocal.githubRepository,
    // "version": "<debug>",

    "token": process.env.token,
    "cookie": process.env.cookie,
    "database": process.env.DATABASE_URL,
    "randomOrgToken": process.env.randomOrgToken,
    "githubToken": process.env.githubToken,
    "githubLogin": process.env.githubLogin,
    "githubRepository": process.env.githubRepository,
    "version": process.env.HEROKU_RELEASE_VERSION,

    "colors": {
        "info": "#FFFF50",
        "warning": "#FF8800",
        "error": "#FF0000",
    },
}