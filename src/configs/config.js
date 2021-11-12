//const configLocal = require('./config.local.js')

module.exports =
{
    //"token" : configLocal.token,
    "token" : process.env.token,
    //"cookie": configLocal.cookie,
    "cookie": process.env.cookie,

    "rulesPath": "src/data/rules.json",
    "logesPath": "logs"
}