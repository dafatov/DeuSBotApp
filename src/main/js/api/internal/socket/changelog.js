const {APPLICATIONS, clearCache, getAll} = require('../../../db/repositories/changelog');
const {publish} = require('../../../actions/changelog');

module.exports = {
  execute({socket}) {
    socket.on('changelog:changelog', () => getAll()
      .then(changelogList => socket.emit('changelog:changelog', {
        status: 200, data: changelogList,
      })));

    socket.on('changelog:publish', (version, changelog, callback) =>
      publish(version, APPLICATIONS.DEUS_BOT_APP, changelog.isPublic, changelog.message)
        .then(version => callback(version))
        .then(() => clearCache())
        .then(() => getAll())
        .then(changelogList => socket.emit('changelog:changelog', {
          status: 200, data: changelogList,
        })));
  },
};
