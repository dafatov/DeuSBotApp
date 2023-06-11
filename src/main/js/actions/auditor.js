const {CATEGORIES, TYPES, add, getAll, removeBeforeWithOffset} = require('../db/repositories/audit');
const {getFixedT, t} = require('i18next');
const {getStackTrace, padEnum, spell} = require('../utils/string');
const {bigIntReplacer} = require('../utils/mapping');
const {isExactlyTime} = require('../utils/dateTime');

module.exports.init = async () => {
  await (async function loop() {
    if (isExactlyTime(new Date(), 0, 0)) {
      const interval = {value: '1M', description: spell(1, Object.values(getFixedT(null, null, 'common:time')('months', {returnObjects: true}).name))};

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
    await module.exports.audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.AUDITOR,
      message: t('inner:audit.auditor.wrongType', {type}),
    });
    type = TYPES.ERROR;
  }

  if (!Object.values(CATEGORIES).includes(category)) {
    await module.exports.audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.AUDITOR,
      message: t('inner:audit.auditor.wrongCategory', {category}),
    });
    category = CATEGORIES.UNCATEGORIZED;
  }

  if (process.env.LOGGING === 'DEBUG' || type !== TYPES.DEBUG) {
    // eslint-disable-next-line no-console
    console.log(t('inner:audit.pattern', {
      type: padEnum(type, TYPES),
      category: padEnum(category, CATEGORIES),
      guildId: guildId ?? '                  ',
      message: message,
    }));
  }
  if (process.env.LOGGING === 'DEBUG') {
    // eslint-disable-next-line no-console
    console.log(getStackTrace(new Error(message)));
  }
  return await add({guildId, type, category, message});
};

module.exports.getGuilds = client =>
  getAll().then(audit => audit.map(a => a.guild_id))
    .then(guildIds => client.guilds.fetch()
      .then(guilds => guilds.filter(guild => guildIds.includes(guild.id))))
    .then(guilds => guilds.map(guild => ({id: guild.id, name: guild.name})))
    .then(guilds => JSON.stringify(guilds, bigIntReplacer));
