const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {destroyConnection, getChannelId, isConnected, isSameChannel} = require('../../actions/player');
const {audit} = require('../../actions/auditor');
const {t} = require('i18next');

module.exports.execute = async ({client, newState}) => {
  if (!isConnected(newState.guild.id)) {
    return;
  }

  if ((isSameChannel(newState.guild.id, newState?.channelId) || newState.member.user.id !== client.user.id)
    && await hasUsersInVoice(newState)) {
    return;
  }

  await destroyConnection(newState.guild.id);
  await audit({
    guildId: newState.guild.id,
    type: TYPES.INFO,
    category: CATEGORIES.STATE_UPDATE,
    message: t('inner:audit.voiceStateUpdate.botLeaved'),
  });
};

const hasUsersInVoice = newState =>
  newState.guild.channels.fetch(getChannelId(newState.guild.id))
    .then(channel => channel.members.filter(member => !member.user.bot).size)
    .then(count => count > 0);
