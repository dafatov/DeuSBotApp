const express = require("express");
const {log} = require("./utils/logger");
const fs = require("fs");

module.exports.init = () => {
  const port = 3000;
  const app = express();

  app.listen(port, () => {
    log(`Успешно запущен сервер по адресу http://localhost:${port}/`);
  });
  app.get('/', (req, res) => {
    res.send("У бота DeuS теперь есть API.\nВсе права принадлежат dafatov (aka DemetriouS)");
  });

  fs.readdirSync('./src/api')
    .filter(f => !f.startsWith('_'))
    .filter(f => f.endsWith('js'))
    .map(f => require(`./api/${f}`))
    .forEach(api => {
      api.execute(app);
    });
}