const {SCOPES, getAll, setPatch} = require('../../../db/repositories/permission');
const {authCheckForbidden, authForScopes} = require('../security');
const {t} = require('i18next');

module.exports = {
  execute({socket, client}) {
    socket.on('permission:getUserScopes', (token, callback) =>
      authForScopes(token)
        .then(scopes => callback({scopes})));

    socket.on('permission:getScopesDictionary', callback =>
      callback({SCOPES}));

    socket.on('permission:permissions', token =>
      authCheckForbidden(token, SCOPES.API_PERMISSION_PERMISSIONS)
        .then(() => getAll())
        .then(permissions => socket.emit('permission:permissions', {status: 200, data: permissions}))
        .catch(() => socket.emit('permission:permissions', {status: 403, data: t('inner:server.status.403', {resource: 'permissions'})})));

    socket.on('permission:setPatch', (token, patch, callback) =>
      authCheckForbidden(token, SCOPES.API_PERMISSION_SET)
        .then(() => setPatch(patch))
        .then(() => getAll())
        .then(permissions => callback({status: 200, data: t('inner:server.status.200', {resource: 'patch'}), permissions}))
        .catch(() => callback({status: 403, data: t('inner:server.status.403', {resource: 'permissions'})})));

    socket.on('permission:getUser', (userId, callback) =>
      client.users.fetch(userId)
        .then(user => callback(user)));

    socket.on('permission:getUsers', callback =>
      client.guilds.fetch()
        .then(guilds => guilds.reduce((accPromise, guild) => guild.fetch()
          .then(guild => guild.members.fetch())
          .then(members => members.map(member => member.user))
          .then(users => users.filter(user => !user.bot))
          .then(users => accPromise
            .then(acc => [
              ...acc,
              ...users.filter(user => !acc.map(accUser => accUser.id).includes(user.id)),
            ])), Promise.resolve([]))
          .then(users => callback(users))));

    socket.on('permission:getScopes', callback =>
      callback(Object.values(SCOPES)));
  },
};
