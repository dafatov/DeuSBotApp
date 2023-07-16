const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const fs = require('fs');
const {stringify} = require('../utils/string');

let radios;

module.exports.getRadios = async () => {
  if (!radios) {
    radios = await generateRadios();
  }

  return radios;
};

module.exports.clearCache = () => {
  radios = null;
  return true;
};

const generateRadios = () =>
  fs.readdirSync('./src/main/js/actions/radios')
    .filter(fileName => fileName.endsWith('.js'))
    .reduce((accPromise, fileName) => Promise.resolve(require(`./radios/${fileName}`))
      .then(radio => radio.getChannels()
        .then(channels => accPromise
          .then(acc => ({
            ...acc,
            ...channels.reduce((acc, channel) => ({
              ...acc,
              [channel.title]: {
                channel,
                getInfo: () => radio.getInfo(channel.id),
              },
            }), Promise.resolve({})),
          })))), Promise.resolve({}))
    .catch(error => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.RADIO,
      message: stringify(error),
    }));
