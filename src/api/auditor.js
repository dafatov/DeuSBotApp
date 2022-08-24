const {getGuilds} = require('../actions/auditor');
const {getAll} = require('../db/repositories/audit');
const {authCheckForbidden} = require('../utils/security');
const {SCOPES} = require('../db/repositories/permission');

module.exports = {
  execute({socket, client}) {
    socket.on('auditor:getGuilds', callback =>
      getGuilds(client).then(guilds => callback({guilds})));

    socket.on('auditor:audit', (token) =>
      authCheckForbidden(token, SCOPES.API_AUDITOR_AUDIT)
        .then(() => getAll())
        .then(audit => socket.emit('auditor:audit', {status: 200, data: audit}))
        .catch(() => socket.emit('auditor:audit', {status: 403, data: 'Доступ к данным аудита запрещен'})));
  },
};
