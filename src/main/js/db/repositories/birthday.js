const {db} = require('../../actions/db');
const {transaction} = require('../dbUtils');

let todayBirthdays;
let birthdays;

module.exports.getTodayBirthdayUserIds = async () => {
  if (!todayBirthdays?.birthdays || todayBirthdays?.today.getDay() !== new Date().getDay()) {
    const response = await db.query(`SELECT *
                                         FROM birthday
                                         WHERE date_part('month', date) = date_part('month', current_date)
                                           AND date_part('day', date) = date_part('day', current_date)
                                           AND ignored = FALSE`);
    todayBirthdays = {today: new Date(), birthdays: response.rows.map(row => row.user_id) || []};
  }
  return todayBirthdays.birthdays;
};

module.exports.getAll = async () => {
  if (!birthdays) {
    const response = await db.query('SELECT * FROM birthday');
    birthdays = response.rows || [];
  }
  return birthdays;
};

module.exports.get = async userId => {
  return (await db.query('SELECT * FROM birthday WHERE user_id=$1', [userId])).rows
    .map(b => ({userId: b.user_id, date: b.date, ignored: b.ignored})) || [];
};

module.exports.ignore = async userId => {
  const current = (await this.get(userId))[0];

  await this.set(userId, current?.date, !(current?.ignored ?? false));

  return current;
};

module.exports.set = async (userId, date, ignored = false) => {
  await transaction(async () => {
    await this.remove(userId);
    await db.query('INSERT INTO birthday (user_id, date, ignored) VALUES ($1, $2, $3)', [userId, date, ignored]);
  });
};

module.exports.remove = async userId => {
  this.clearCache();
  await db.query('DELETE FROM birthday WHERE user_id=$1', [userId]);
};

module.exports.clearCache = () => {
  todayBirthdays = null;
  birthdays = null;
  return true;
};
