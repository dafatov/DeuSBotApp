const {SCOPES} = require('../../../db/repositories/permission');
const {authCheckForbidden} = require('../security');
const fs = require('fs');
const {stringify} = require('../../../utils/string');

module.exports = {
  execute({app}) {
    app.post('/repository/clear-cache', (req, res) =>
      authCheckForbidden(req.headers.authorization?.split(' ')[1], SCOPES.API_REPOSITORY_CACHE)
        .then(() => JSON.parse(req.query.repositories))
        .then(repositories => repositories.length === 0
          ? fs.readdirSync('./src/main/js/db/repositories')
            .filter(f => f.endsWith('.js'))
          : repositories)
        .then(repositories => repositories
          .reduce((acc, repository) => ({
            ...acc,
            [repository]: require(`../../../db/repositories/${repository}`).clearCache?.() ?? null,
          }), {}))
        .then(repositories => res.status(200).json(repositories))
        .catch(error => res.status(403).send(stringify(error))));
  },
};
