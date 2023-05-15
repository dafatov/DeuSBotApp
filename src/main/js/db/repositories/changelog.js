const {db} = require('../../actions/db');
const {isVersionUpdated} = require('../../utils/string');

module.exports.APPLICATIONS = Object.freeze({
  DEUS_BOT: 'deus_bot',
  DEUS_BOT_APP: 'deus_bot_app',
});

let changelogs;

module.exports.getAll = async () => {
  if (!changelogs) {
    changelogs = (await db.query('SELECT * FROM changelog')).rows || [];
  }
  return changelogs;
};

module.exports.getUnshown = async () => await this.getAll()
  .then(all => all.filter(changelog => !changelog.shown));

module.exports.getLast = async application => await this.getAll()
  .then(all => getLastVersion(application)
    .then(lastVersion => all.find(changelog =>
      changelog.version === lastVersion)));

module.exports.add = async (version, application, message) => {
  if (await isValidAdd(version, application)) {
    this.clearCache();
    await db.query('INSERT INTO changelog (version, application, message, shown) VALUES ($1, $2, $3, $4)', [version, application, message, false]);
  }
};

module.exports.shown = async (version, application) => {
  if (await isValidShown(version, application)) {
    this.clearCache();
    await db.query(`UPDATE changelog
                    SET shown = TRUE
                        WHERE application = $1
                          AND version = $2`, [application, version]);
  }
};

module.exports.clearCache = () => {
  changelogs = null;
  return true;
};

const isValidAdd = async (version, application) => {
  const lastVersion = await getLastVersion(application);
  return isVersionUpdated(lastVersion ?? '0.0.0', version);
};

const isValidShown = async (version, application) => {
  const firstUnshownVersion = await this.getAll()
    .then(all => all.filter(item => !item.shown))
    .then(all => all.filter(item => item.application === application))
    .then(all => all.map(item => item.version))
    .then(all => all.sort((a, b) => isVersionUpdated(a, b)
      ? -1
      : 1))
    .then(versions => versions[0]);
  return firstUnshownVersion === version;
};

const getLastVersion = application => this.getAll()
  .then(all => all.filter(item => item.application === application))
  .then(all => all.map(item => item.version))
  .then(all => all.sort((a, b) => isVersionUpdated(a, b)
    ? 1
    : -1))
  .then(versions => versions[0]);
