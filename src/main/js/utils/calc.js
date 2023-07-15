const {getDuration} = require('../actions/player');
const {ifPromise} = require('./promises');

module.exports.remained = (guildId, nowPlaying) => getDuration(guildId)
  .then(queueDurationSec => queueDurationSec ?? 0)
  .then(queueDurationSec => queueDurationSec + parseInt(nowPlaying.song?.duration ?? 0))
  .then(fullDurationSec => 1000 * fullDurationSec)
  .then(fullDuration => Promise.resolve(nowPlaying.song?.isLive)
    .then(isLive => ifPromise(isLive ?? true, () => 0, () => nowPlaying.resource?.playbackDuration))
    .then(playbackDuration => playbackDuration ?? 0)
    .then(playbackDuration => fullDuration - playbackDuration));
