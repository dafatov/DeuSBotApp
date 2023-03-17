const {getQueue, hasLive} = require('../actions/player');
const {timeFormatMilliseconds, timeFormatSeconds} = require('./dateTime');
const {getRadios} = require('../actions/radios');
const progressBar = require('string-progressbar');
const {remained} = require('./calc');
const {t} = require('i18next');

module.exports.getAddedDescription = (guildId, info) => {
  const remainedValue = remained(getQueue(guildId));

  return t('discord:embed.player.added.description', {
    count: info.length ?? 1,
    duration: info.isLive
      ? t('common:player.stream')
      : timeFormatSeconds(info.duration),
    length: getQueue(guildId).songs.length + 1,
    beginIn: hasLive(getQueue(guildId))
      ? t('common:player.noRemained')
      : remainedValue === 0
        ? t('common:player.beginNow')
        : timeFormatMilliseconds(remainedValue),
  });
};

module.exports.getNowPlayingDescription = nowPlaying => {
  if (nowPlaying.song.type === 'radio') {
    return getRadios().get(nowPlaying.song.title).getInfo();
  } else if (nowPlaying.song.isLive) {
    return t('discord:embed.player.nowPlaying.description.live');
  } else {
    const barString = progressBar.filledBar(
      nowPlaying.song.duration * 1000,
      nowPlaying.resource.playbackDuration,
    );

    return t('discord:embed.player.nowPlaying.description.withBar', {
      playbackDuration: timeFormatMilliseconds(nowPlaying.resource.playbackDuration),
      length: timeFormatSeconds(nowPlaying.song.duration),
      author: nowPlaying.song.author.username,
      barString: barString[0],
      percent: Math.round(barString[1]),
    });
  }
};
