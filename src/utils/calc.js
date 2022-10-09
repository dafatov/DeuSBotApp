module.exports.remained = queue =>
  1000 * ((queue.remained ?? 0) + parseInt(queue.nowPlaying.song?.length ?? 0))
  - ((queue.nowPlaying.song?.isLive ?? true)
    ? 0
    : queue.nowPlaying.resource?.playbackDuration) ?? 0;
