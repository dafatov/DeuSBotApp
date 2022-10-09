const {APPLICATIONS, cacheReset, getAll} = require('../db/repositories/changelog');
const {publish} = require('../actions/changelog');

module.exports = {
  execute({socket}) {
    socket.on('changelog:changelog', () =>
      getAll().then(changelog => socket.emit(
        'changelog:changelog',
        {status: 200, data: changelog.map(c => ({...c, message: JSON.parse(c.message)}))},
      )));

    socket.on('changelog:publish', (version, changelog, callback) =>
      publish(version, APPLICATIONS.DEUS_BOT_APP, changelog.isPublic, changelog.message)
        .then(v => callback(v))
        .then(() => cacheReset())
        .then(() => getAll())
        .then(changelog => socket.emit(
          'changelog:changelog',
          changelog.map(c => ({...c, message: JSON.parse(c.message)})),
        )));
  },
};
