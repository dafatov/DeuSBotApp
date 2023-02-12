const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const fs = require('fs');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

const radios = new Map();

module.exports.init = async () => {
  await Promise.all(fs.readdirSync('./src/main/js/actions/radios')
    .filter(f => f.endsWith('.js'))
    .map(f => {
      const radio = require(`./radios/${f}`);

      return radio.getChannels()
        .then(channels => channels.forEach(channel =>
          radios.set(channel.title, {
            channel,
            getInfo: () => radio.getInfo(channel.id),
          })));
    }),
  ).then(() => audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.radios'),
  })).catch(error => audit({
    guildId: null,
    type: TYPES.ERROR,
    category: CATEGORIES.RADIO,
    message: stringify(error),
  }));
};

module.exports.getRadios = () => radios;
