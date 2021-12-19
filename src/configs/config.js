// const configLocal = require('./config.local.js')
const {parseStr} = require("../utils/dateTime");

// const {parseStr} = require("../utils/dateTime");

module.exports = {
  // "discordToken": configLocal.discordToken,
  // "cookie": configLocal.cookie,
  // "database": configLocal.database,
  // "randomOrgToken": configLocal.randomOrgToken,
  // "githubToken": configLocal.githubToken,
  // "githubLogin": configLocal.githubLogin,
  // "githubRepository": configLocal.githubRepository,
  // "version": parseStr('v1'.substring(1)),

  "discordToken": process.env.discordToken,
  "cookie": process.env.cookie,
  "database": process.env.DATABASE_URL,
  "randomOrgToken": process.env.randomOrgToken,
  "githubToken": process.env.githubToken,
  "githubLogin": process.env.githubLogin,
  "githubRepository": process.env.githubRepository,
  "version": parseStr(process.env.HEROKU_RELEASE_VERSION.substring(1)),

  "colors": {
    "info": "#FFFF50",
    "warning": "#FF8800",
    "error": "#FF0000",
  },
}