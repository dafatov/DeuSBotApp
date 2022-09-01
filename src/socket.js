const express = require("express");
const {createServer} = require("http");
const {Server} = require("socket.io");
const {log} = require("./utils/logger");
const fs = require('fs');
const {version} = require('../package');

module.exports.init = (client) => {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {cors: {origin: '*'}});

  app.get('/', (_req, res) => {
    res.send(
      `Данный бот (Deus v${version}) был разработан DemetriouS (aka dafatov) в рамках частного проекта специально для дискорд сервера на чистом энтузиазме`);
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      //
    });

    fs.readdirSync('./src/api')
      .filter(f => !f.startsWith('_'))
      .filter(f => f.endsWith('js'))
      .map(f => require(`./api/${f}`))
      .forEach(api => {
        api.execute({io, socket, client});
      });
  });

  httpServer.listen(process.env.PORT);
  log('Успешно запущен api сервер');
}
