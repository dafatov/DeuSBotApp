const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {clearConnection, clearNowPlaying, clearQueue, getQueue} = require('../../actions/player');
const {VoiceConnectionStatus} = require('@discordjs/voice');
const {audit} = require('../../actions/auditor');
const {t} = require('i18next');

module.exports.execute = async ({client, newState}) => {
  const queue = getQueue(newState.guild.id);

  if (!queue.connection || queue.connection._state.status === VoiceConnectionStatus.Destroyed) {
    return;
  }

  if ((newState?.channelId === queue.voiceChannel.id || newState.id !== client.user.id)
    && queue.voiceChannel.members.filter(member => !member.user.bot).size >= 1) {
    return;
  }

  queue.connection.destroy();
  clearNowPlaying(newState.guild.id);
  clearQueue(newState.guild.id);
  clearConnection(newState.guild.id);
  await audit({
    guildId: newState.guild.id,
    type: TYPES.INFO,
    category: CATEGORIES.STATE_UPDATE,
    message: t('inner:audit.voiceStateUpdate.botLeaved'),
  });
};
