const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {VoiceConnectionStatus} = require('@discordjs/voice');
const {audit} = require('./auditor');
const player = require('./player');
const {t} = require('i18next');

module.exports.voiceStateUpdate = async (newState, client) => {
  if (!player.getQueue(newState.guild.id)?.voiceChannel
    || !player.getQueue(newState.guild.id).connection
    || player.getQueue(newState.guild.id).connection._state.status === VoiceConnectionStatus.Destroyed) {
    return;
  }

  if (newState.id === client.user.id && (!newState.channelId || newState.channelId !== player.getQueue(newState.guild.id).voiceChannel.id)
    || player.getQueue(newState.guild.id).voiceChannel.members
      .filter(m => !m.user.bot).size < 1) {
    player.getQueue(newState.guild.id).connection.destroy();
    player.clearNowPlaying(newState.guild.id);
    player.clearQueue(newState.guild.id);
    player.clearConnection(newState.guild.id);
    await audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.STATE_UPDATE,
      message: t('inner:audit.voiceStateUpdate.botLeaved'),
    });
  }
};
