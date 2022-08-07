const {CATEGORIES, TYPES} = require("../actions/auditor");
const {getAll} = require("../repositories/audit");

module.exports = {
  execute({socket}) {
    socket.on("auditor:getTypes", callback =>
      callback({types: TYPES}));

    socket.on("auditor:getCategories", callback =>
      callback({categories: CATEGORIES}));

    socket.on("auditor:audit", () =>
      getAll().then(audit => socket.emit("auditor:audit", audit)));
  }
}