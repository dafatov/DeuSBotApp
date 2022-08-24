const {SCOPES, getAll, setPatch} = require('../db/repositories/permission');
const {authForScopes, authCheckForbidden} = require('../utils/security');

module.exports = {
  execute({socket, client}) {
    socket.on('permission:getUserScopes', (token, callback) =>
      authForScopes(token)
        .then((scopes) => callback({scopes})));

    socket.on('permission:getScopesDictionary', callback =>
      callback({SCOPES}));

    socket.on('permission:permissions', (token) =>
      authCheckForbidden(token, SCOPES.API_PERMISSION_PERMISSIONS)
        .then(() => getAll())
        .then(permissions => socket.emit('permission:permissions', {status: 200, data: permissions}))
        .catch(() => socket.emit('permission:permissions', {status: 403, data: 'Доступ к данным контроля доступа запрещен'})));

    socket.on('permission:setPatch', (token, patch, callback) =>
      authCheckForbidden(token, SCOPES.API_PERMISSION_SET)
        .then(() => setPatch(patch))
        .then(() => getAll())
        .then(permissions => callback({status: 200, data: 'Патч успешно применен', permissions}))
        .catch(() => callback({status: 403, data: 'Доступ к данным контроля доступа запрещен'})));

    socket.on('permission:getUser', (userId, callback) =>
      client.users.fetch(userId)
        .then(user => callback(user)));

    socket.on('permission:getUsers', (callback) =>
      client.guilds.fetch()
        .then(guilds => guilds.reduce((acc, guild) => guild.fetch()
          .then(guild => guild.members.fetch())
          .then(members => members.map(member => member.user))
          .then(users => users.filter(user => !user.bot))
          .then(async users => [
              ...new Set([
                ...(await acc),
                ...users,
              ]),
            ],
          ), []))
        .then(users => callback(users)));

    socket.on('permission:getScopes', (callback) =>
      callback(Object.values(SCOPES)));
  },
};
