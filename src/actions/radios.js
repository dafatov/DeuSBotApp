const fs = require("fs");
const {log} = require("../utils/logger");

let radios = new Map();

module.exports.init = async () => {
  await Promise.all(fs.readdirSync('./src/actions/radios')
    .filter(f => f.endsWith('.js'))
    .map(async f => {
      const radio = require(`./radios/${f}`);
      (await radio.getChannels()).forEach(c => {
        radios.set(c.title, {
          channel: c,
          async getInfo() {
            return await radio.getInfo(c.id);
          }
        })
      })
    })
  ).then(() => log('Успешно зарегистрированы радиостанции'));
}

module.exports.getRadios = () => {
  return radios;
}