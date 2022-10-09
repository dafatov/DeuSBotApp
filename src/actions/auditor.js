const {CATEGORIES, TYPES, add, getAll, removeBeforeWithOffset} = require('../db/repositories/audit');
const {padEnum, stringify} = require('../utils/string');
const {bigIntReplacer} = require('../utils/jsonMapping');
const {t} = require('i18next');

module.exports.init = async () => {
  await (async function loop() {
    if (condition()) {
      const interval = {value: '1M', description: t('common:calendar.month.numeral.monthWithCount_one', {count: 1})};

      await removeBeforeWithOffset(interval.value).then(response => {
        if (response?.rowCount > 0) {
          module.exports.audit({
            guildId: null,
            type: TYPES.INFO,
            category: CATEGORIES.AUDITOR,
            message: t('inner:audit.auditor.removed', {rowCount: response?.rowCount, interval: interval.description}),
          });
        }
      });
    }
    setTimeout(loop, 90000 - (new Date() % 60000));
  }()).then(() => module.exports.audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.auditor'),
  }));
};

module.exports.audit = async ({guildId, type, category, message}) => {
  if (!Object.values(TYPES).includes(type)) {
    type = TYPES.ERROR;
  }
  if (!Object.values(CATEGORIES).includes(category)) {
    category = CATEGORIES.UNCATEGORIZED;
  }
  message = stringify(message);
  await add({guildId, type, category, message});
  if (process.env.LOGGING === 'DEBUG' || type !== TYPES.DEBUG) {
    // eslint-disable-next-line no-console
    console.log(t('inner:audit.pattern', {
      type: padEnum(type, TYPES),
      category: padEnum(category, CATEGORIES),
      guildId: guildId ?? '                  ',
      message: message,
    }));
  }
};

module.exports.getGuilds = client =>
  getAll().then(audit => audit.map(a => a.guild_id))
    .then(guildIds => client.guilds.fetch()
      .then(guilds => guilds.filter(guild => guildIds.includes(guild.id))))
    .then(guilds => JSON.stringify(guilds, bigIntReplacer));

const condition = () => {
  const now = new Date();
  return now.getHours() === 0 && now.getMinutes() === 0;
};
