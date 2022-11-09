const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const fs = require('fs');
const {t} = require('i18next');
const {stringify} = require('../utils/string');

const radios = new Map();

module.exports.init = async () => {
  await Promise.all(fs.readdirSync('./src/actions/radios')
    .filter(f => f.endsWith('.js'))
    .map(async f => {
      const radio = require(`./radios/${f}`);

      try {
        (await radio.getChannels()).forEach(c => {
          radios.set(c.title, {
            channel: c,
            async getInfo() {
              return await radio.getInfo(c.id);
            },
          });
        });
      } catch (error) {
        await audit({
          guildId: null,
          type: TYPES.ERROR,
          category: CATEGORIES.RADIO,
          message: stringify(error),
        });
      }
    }),
  ).then(() => audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.radios'),
  }));
};

module.exports.getRadios = () => {
  return radios;
};
