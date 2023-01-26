const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {begin, finish} = require('../../db/repositories/session');
const {audit} = require('../../actions/auditor');
const {stringify} = require('../../utils/string');
const {update} = require('../../db/repositories/statistics');

module.exports.execute = async ({oldState, newState}) => {
  if (oldState.channelId !== newState.channelId) {
    if (oldState.channelId === null) {
      if (newState.channelId !== null) {
        await begin(newState.member.user.id, newState.guild.id);
      }
    } else if (newState.channelId === null) {
      await finish(oldState.member.user.id, oldState.guild.id)
        .then(result => result.rows[0])
        .then(session => update(newState.member.user.id, newState.guild.id, {
          voiceDuration: {
            begin: session.begin,
            finish: session.finish,
          },
        }))
        .catch(e => audit({
          guildId: newState.guild.id,
          type: TYPES.ERROR,
          category: CATEGORIES.STATE_UPDATE,
          message: stringify(e),
        }));
    }
  }
};
