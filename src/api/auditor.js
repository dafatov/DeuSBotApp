const {SCOPES} = require('../db/repositories/permission');
const {authCheckForbidden} = require('../utils/security');
const {getAll} = require('../db/repositories/audit');
const {getGuilds} = require('../actions/auditor');
const {t} = require('i18next');

module.exports = {
  execute({socket, client}) {
    socket.on('auditor:getGuilds', callback =>
      getGuilds(client).then(guilds => callback({guilds})));

    socket.on('auditor:audit', token =>
      authCheckForbidden(token, SCOPES.API_AUDITOR_AUDIT)
        .then(() => getAll())
        .then(audit => socket.emit('auditor:audit', {status: 200, data: audit}))
        .catch(() => socket.emit('auditor:audit', {status: 403, data: t('inner:server.status.403', {resource: 'audit'})})));
  },
};
