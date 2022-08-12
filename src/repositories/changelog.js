const {db} = require('../actions/db');

let changelogs;

module.exports.getAll = async () => {
  if (!changelogs) {
    changelogs = (await db.query('SELECT * FROM CHANGELOG')).rows || [];
  }
  return changelogs;
};

module.exports.getUnshown = async () => await this.getAll()
  .then(all => all.filter(changelog => !changelog.shown));

module.exports.getLast = async (application) => await this.getAll()
  .then(all => getLastVersion(application)
    .then(lastVersion => all.find(changelog =>
      parseInt(changelog.version) === lastVersion)));

module.exports.add = async (version, application, message) => {
  if (await isValidAdd(version, application)) {
    this.cacheReset();
    await db.query('INSERT INTO CHANGELOG (version, application, message, shown) VALUES ($1, $2, $3, $4)', [version, application, message, false]);
  }
};

module.exports.shown = async (version, application) => {
  if (await isValidShown(parseInt(version), application)) {
    this.cacheReset();
    await db.query(`UPDATE CHANGELOG
                    SET SHOWN = true
                    WHERE APPLICATION = $1
                      AND VERSION = $2`, [application, version]);
  }
};

module.exports.cacheReset = () => changelogs = null;

const isValidAdd = async (version, application) => {
  const lastVersion = await getLastVersion(application);
  return (lastVersion ?? 0) < version;
};

const isValidShown = async (version, application) => {
  const firstUnshownVersion = await this.getAll()
    .then(all => all.filter(item => !item.shown))
    .then(all => all.filter(item => item.application === application))
    .then(all => all.map(item => item.version))
    .then(versions => Math.min(...versions));
  return firstUnshownVersion === version;
};

const getLastVersion = (application) => this.getAll()
  .then(all => all.filter(item => item.application === application))
  .then(all => all.map(item => item.version))
  .then(versions => Math.max(...versions));
