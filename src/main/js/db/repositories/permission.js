const {db} = require('../../actions/db');
const {t} = require('i18next');
const {transaction} = require('../dbUtils');

module.exports.SCOPES = Object.freeze({
  COMMAND_BIRTHDAY_SET: 'command.birthday.set',
  COMMAND_BIRTHDAY_REMOVE: 'command.birthday.remove',
  COMMAND_BIRTHDAY_SHOW: 'command.birthday.show',
  COMMAND_BIRTHDAY_IGNORE: 'command.birthday.ignore',
  COMMAND_CLEAR: 'command.clear',
  COMMAND_HELP: 'command.help',
  COMMAND_ISSUE: 'command.issue',
  COMMAND_LOOP: 'command.loop',
  COMMAND_MOVE: 'command.move',
  COMMAND_NP: 'command.np',
  COMMAND_PAUSE: 'command.pause',
  COMMAND_PING: 'command.ping',
  COMMAND_PLAY: 'command.play',
  COMMAND_PUBLICIST_SET: 'command.publicist.set',
  COMMAND_PUBLICIST_SHOW: 'command.publicist.show',
  COMMAND_PUBLICIST_REMOVE: 'command.publicist.remove',
  COMMAND_QUEUE: 'command.queue',
  COMMAND_RADIO: 'command.radio',
  COMMAND_REMOVE: 'command.remove',
  COMMAND_RESPONSE_SET: 'command.response.set',
  COMMAND_RESPONSE_REMOVE: 'command.response.remove',
  COMMAND_RESPONSE_SHOW: 'command.response.show',
  COMMAND_SHIKIMORI_PLAY: 'command.shikimori.play',
  COMMAND_SHIKIMORI_SET: 'command.shikimori.set',
  COMMAND_SHIKIMORI_REMOVE: 'command.shikimori.remove',
  COMMAND_SHIKIMORI_EXPORT: 'command.shikimori.export',
  COMMAND_SHUFFLE: 'command.shuffle',
  COMMAND_SKIP: 'command.skip',
  COMMAND_STATISTICS_SESSION: 'command.statistics.session',
  COMMAND_STATISTICS_MESSAGES: 'command.statistics.messages',
  COMMAND_STATISTICS_VOICES: 'command.statistics.voices',

  API_CHANGELOG_CHANGELOG: 'api.changelog.changelog',
  API_CHANGELOG_PUBLISH: 'api.changelog.publish',
  API_AUDITOR_AUDIT: 'api.auditor.audit',
  API_PERMISSION_PERMISSIONS: 'api.permission.permissions',
  API_PERMISSION_SET: 'api.permission.set',
  API_REPOSITORY_CACHE: 'api.repository.cache',

  PAGE_ADMINISTRATION: 'page.administration',
  PAGE_PLAYER: 'page.player',
});

let permissions;

module.exports.getAll = async () => {
  if (!permissions) {
    permissions = (await db.query('SELECT * FROM permission')).rows
      .map(permission => ({
        user_id: permission.user_id,
        isWhiteList: permission.is_white_list,
        scopes: JSON.parse(permission.scopes),
      })) || [];
  }
  return permissions;
};

module.exports.getScopes = userId =>
  this.getAll()
    .then(all => all.find(item => item.user_id === userId))
    .then(permission => {
      if (permission.isWhiteList) {
        return (permission?.scopes ?? []);
      } else {
        return Object.values(this.SCOPES).filter(scope => !(permission?.scopes ?? []).includes(scope));
      }
    }).catch(() => []);

module.exports.isForbidden = async (userId, scope) =>
  !(await this.getScopes(userId).then(scopes => scopes.includes(scope)));

module.exports.clearCache = () => {
  permissions = null;
  return true;
};

module.exports.setPatch = async patch => {
  await transaction(async () => {
    const toDelete = [
      ...new Set(patch.deleted
        .concat(patch.updated.filter(permission => !patch.created.some(item => permission.user_id === item.user_id)))
        .map(permission => permission.user_id)),
    ];
    await remove(toDelete);

    const toAdd = patch.updated
      .concat(patch.created.filter(permission => !patch.updated.some(item => permission.user_id === item.user_id)))
      .filter(permission => !patch.deleted.some(item => permission.user_id === item.user_id));
    await Promise.all(toAdd.map(permission => add(permission.user_id, permission.isWhiteList, permission.scopes)));
  });
};

const add = async (userId, isWhiteList, scopes) => {
  if (isValidScopes(scopes)) {
    this.clearCache();
    await db.query('INSERT INTO permission (user_id, is_white_list, scopes) VALUES ($1, $2, $3)', [
      userId,
      isWhiteList,
      JSON.stringify(scopes),
    ]);
  } else {
    throw t('inner:error.invalidScope', {userId, isWhiteList, scopes: JSON.stringify(scopes)});
  }
};

const remove = async userIds => {
  this.clearCache();
  await db.query(`DELETE
                      FROM permission
                      WHERE user_id = ANY ($1)`, [[...userIds]]);
};

const isValidScopes = scopes =>
  scopes.every(scope => Object.values(this.SCOPES).includes(scope));
