const {CATEGORIES, TYPES} = require('./db/repositories/audit');
const {Server} = require('socket.io');
const {audit} = require('./actions/auditor');
const {createServer} = require('http');
const express = require('express');
const fs = require('fs');
const {t} = require('i18next');
const {version} = require('../package');

module.exports.init = async client => {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {cors: {origin: '*'}});

  app.get('/', (_req, res) =>
    res.send(t('web:about', {version})));

  io.on('connection', socket => {
    fs.readdirSync('./src/api')
      .filter(f => !f.startsWith('_'))
      .filter(f => f.endsWith('js'))
      .map(f => require(`./api/${f}`))
      .forEach(api => {
        api.execute({io, socket, client});
      });
  });

  httpServer.listen(process.env.PORT);
  await audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.server'),
  });
};
