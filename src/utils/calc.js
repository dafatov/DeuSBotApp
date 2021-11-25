module.exports.remained = (queue) => {
    return 1000 * (queue.remained
        + parseInt(queue.nowPlaying.song?.length ?? 0))
        - (queue.nowPlaying.resource?.playbackDuration ?? 0)
}