const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {destroyConnection, isConnected, isSameChannel} = require('../../actions/player');
const {audit} = require('../../actions/auditor');
const {t} = require('i18next');

module.exports.execute = async ({client, newState}) => {
  if (!isConnected(newState.guild.id)) {
    return;
  }

  if ((isSameChannel(newState.guild.id, newState?.channelId) || newState.id !== client.user.id)
    && await newState.guild.channels.fetch(newState?.channelId)
      .then(channel => channel.members.filter(member => !member.user.bot).size >= 1)) {
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
