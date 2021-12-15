module.exports.getStatusIcon = (nowPlaying) => {
  if (nowPlaying.isPause && nowPlaying.isLoop) {
    return 'pause-loop';
  } else if (!nowPlaying.isPause && nowPlaying.isLoop) {
    return 'play-loop';
  } else if (nowPlaying.isPause && !nowPlaying.isLoop) {
    return 'pause';
  } else if (!nowPlaying.isPause && !nowPlaying.isLoop) {
    return 'play';
  } else {
    throw 'Не корректное состояние плеера';
  }
}