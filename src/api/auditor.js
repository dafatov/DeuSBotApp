const {getGuilds} = require("../actions/auditor");
const {getAll} = require("../repositories/audit");

module.exports = {
  execute({socket, client}) {
    socket.on("auditor:getGuilds", callback =>
      getGuilds(client).then(guilds => callback({guilds})));

    socket.on("auditor:audit", () =>
      getAll().then(audit => socket.emit("auditor:audit", audit)));
  }
}