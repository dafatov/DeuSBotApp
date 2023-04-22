const {getDuration} = require('../actions/player');

module.exports.remained = async (guildId, nowPlaying) =>
  1000 * (((await getDuration(guildId)) ?? 0) + parseInt(nowPlaying.song?.duration ?? 0))
  - ((nowPlaying.song?.isLive ?? true)
    ? 0
    : nowPlaying.resource?.playbackDuration) ?? 0;
