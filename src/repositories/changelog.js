const {db} = require("../db");
let last;

module.exports.getLast = async () => {
  if (!last) {
    last = (await db.query(`SELECT *
                            FROM CHANGELOG
                            WHERE version in (
                                SELECT MAX(version)
                                FROM changelog)`
    )).rows[0];
  }
  return last;
}

module.exports.add = async (version, description) => {
  if ((await this.getLast())?.version ?? 0 < version) {
    last = null;
    await db.query('INSERT INTO CHANGELOG (version, description, shown) VALUES ($1, $2, $3)', [version, description, false]);
  }
}

module.exports.shown = async (...version) => {
  if (version.every(async v => v <= (await this.getLast()).version)) {
    last = null;
    await db.query(`UPDATE CHANGELOG
                    SET SHOWN = true
                    WHERE VERSION = ANY ($1)`, [[...version]]);
  }
}