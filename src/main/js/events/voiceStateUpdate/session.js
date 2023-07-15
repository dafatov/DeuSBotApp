const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {begin, finish} = require('../../db/repositories/session');
const {audit} = require('../../actions/auditor');
const {ifPromise} = require('../../utils/promises');
const {stringify} = require('../../utils/string');
const {update} = require('../../db/repositories/statistics');

module.exports.execute = ({oldState, newState}) => {
  if (oldState.channelId === newState.channelId || oldState.channelId !== null && newState.channelId !== null) {
    return;
  }

  if (oldState.channelId === null) {
    return begin(newState.member.user.id, newState.guild.id);
  }

  if (newState.channelId === null) {
    return finish(oldState.member.user.id, oldState.guild.id)
      .then(result => result.rows[0])
      .then(session => ifPromise(session?.begin, () => update(session.user_id, session.guild_id, {
        voiceDuration: {
          begin: session.begin,
          finish: session.finish,
        },
      })))
      .catch(e => audit({
        guildId: newState.guild.id,
        type: TYPES.ERROR,
        category: CATEGORIES.STATE_UPDATE,
        message: stringify(e),
      }));
  }
};
