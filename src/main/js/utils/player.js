const {getNowPlaying, getSize, hasLive} = require('../actions/player');
const {timeFormatMilliseconds, timeFormatSeconds} = require('./dateTime');
const {TYPES} = require('../db/repositories/queue');
const {getRadios} = require('../actions/radios');
const progressBar = require('string-progressbar');
const {remained} = require('./calc');
const {t} = require('i18next');

module.exports.getAddedDescription = async (guildId, info) => {
  const remainedValue = await remained(guildId, getNowPlaying(guildId));

  return t('discord:embed.player.added.description', {
    count: info.length ?? 1,
    duration: info.isLive
      ? t('common:player.stream')
      : timeFormatSeconds(info.duration),
    length: await getSize(guildId) + 1,
    beginIn: await hasLive(guildId)
      ? t('common:player.noRemained')
      : remainedValue === 0
        ? t('common:player.beginNow')
        : timeFormatMilliseconds(remainedValue),
  });
};

module.exports.getNowPlayingDescription = async (interaction, nowPlaying) => {
  if (nowPlaying.song.type === TYPES.RADIO) {
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
      author: await interaction.guild.fetch()
        .then(guild => guild.members.fetch(nowPlaying.song.userId))
        .then(member => member.displayName),
      barString: barString[0],
      percent: Math.round(barString[1]),
    });
  }
};
