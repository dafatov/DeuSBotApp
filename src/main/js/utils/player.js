const {getNowPlaying, getSize, hasLive} = require('../actions/player');
const {timeFormatMilliseconds, timeFormatSeconds} = require('./dateTime');
const {TYPES} = require('../db/repositories/queue');
const {getRadios} = require('../actions/radios');
const {ifPromise} = require('./promises');
const progressBar = require('string-progressbar');
const {remained} = require('./calc');
const {t} = require('i18next');

module.exports.getAddedDescription = async (guildId, info) => {
  const length = await getSize(guildId)
    .then(size => size + 1);
  const beginIn = await hasLive(guildId)
    .then(hasLive => ifPromise(hasLive, () => t('common:player.noRemained'),
      () => remained(guildId, getNowPlaying(guildId))
        .then(remained => ifPromise(remained === 0, () => t('common:player.beginNow'),
          () => timeFormatMilliseconds(remained) ?? t('common:player.overDay'),
        )),
    ));

  return t('discord:embed.player.added.description', {
    count: info.length ?? 1,
    duration: info.isLive
      ? t('common:player.stream')
      : timeFormatSeconds(info.duration) ?? t('common:player.overDay'),
    length,
    beginIn,
  });
};

module.exports.getNowPlayingDescription = async (interaction, nowPlaying) => {
  if (nowPlaying.song.type === TYPES.RADIO) {
    return getRadios().get(nowPlaying.song.title).getInfo();
  } else if (nowPlaying.song.isLive) {
    return t('discord:embed.player.nowPlaying.description.live');
  } else {
    const author = await interaction.guild.fetch()
      .then(guild => guild.members.fetch(nowPlaying.song.userId))
      .then(member => member.displayName);
    const barString = progressBar.filledBar(
      nowPlaying.song.duration * 1000,
      nowPlaying.resource.playbackDuration,
    );

    return t('discord:embed.player.nowPlaying.description.withBar', {
      playbackDuration: timeFormatMilliseconds(nowPlaying.resource.playbackDuration) ?? t('common:player.overDay'),
      length: timeFormatSeconds(nowPlaying.song.duration) ?? t('common:player.overDay'),
      author,
      barString: barString[0],
      percent: Math.round(barString[1]),
    });
  }
};
