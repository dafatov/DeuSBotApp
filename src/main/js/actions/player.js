const {AudioPlayerStatus, NoSubscriberBehavior, VoiceConnectionStatus, createAudioPlayer, createAudioResource, joinVoiceChannel} = require('@discordjs/voice');
const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {TYPES: SONG_TYPES, addAll, getAll, getCount, getDuration, getPage, hasLive, move, remove, removeAll, shuffle} = require('../db/repositories/queue');
const {timeFormatMilliseconds, timeFormatSeconds} = require('../utils/dateTime');
const {audit} = require('./auditor');
const {getStream} = require('../api/external/youtube');
const {stringify} = require('../utils/string');
const {t} = require('i18next');
const {throughPromise} = require('../utils/promises');

const jukeboxes = new Map();

module.exports.init = async client => {
  await client.guilds.fetch()
    .then(guilds => throughPromise(guilds, () => Promise.all(guilds
      .map(async guild => {
        await this.clearQueue(guild.id);
        setJukebox(guild.id, {
          connection: null,
          nowPlaying: {},
          player: null,
        });
      }))))
    .then(guilds => guilds.map(guild => guild.name))
    .then(guilds => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.INIT,
      message: t('inner:audit.init.player', {guilds}),
    }));
};

module.exports.getNowPlaying = guildId => getJukebox(guildId).nowPlaying;

module.exports.getSize = getCount;

module.exports.getDuration = getDuration;

module.exports.addAll = (guildId, added) => addAll(guildId, added.songs);

module.exports.getAll = getAll;

module.exports.getPage = getPage;

module.exports.remove = remove;

module.exports.move = move;

module.exports.skip = async guildId => {
  const skipped = this.getNowPlaying(guildId).song;

  getJukebox(guildId).player.stop();
  await audit({
    guildId,
    type: TYPES.INFO,
    category: CATEGORIES.PLAYER,
    message: t('inner:audit.player.skip', {song: skipped.title}),
  });
  // Дублирует логику в onIdle. Нужно, чтобы не ждать ивента для обновления команды queue
  this.getNowPlaying(guildId).song = (await this.getPage(guildId, 0, 1))[0];

  return skipped;
};

module.exports.loop = guildId => {
  this.getNowPlaying(guildId).isLoop = !this.getNowPlaying(guildId).isLoop;

  return this.getNowPlaying(guildId).isLoop;
};

module.exports.pause = guildId => {
  if (this.getNowPlaying(guildId).isPause) {
    getJukebox(guildId).player.unpause();
  } else {
    getJukebox(guildId).player.pause();
  }
  this.getNowPlaying(guildId).isPause = !this.getNowPlaying(guildId).isPause;

  return this.getNowPlaying(guildId).isPause;
};

module.exports.shuffle = shuffle;

module.exports.clearQueue = removeAll;

module.exports.hasLive = async guildId => {
  return this.getNowPlaying(guildId).song?.isLive || await hasLive(guildId);
};

module.exports.isEmpty = guildId => this.isLessQueue(guildId, 0);

module.exports.isPlaying = guildId => !!this.getNowPlaying(guildId).song;

module.exports.isLive = guildId => !!this.getNowPlaying(guildId).song.isLive;

module.exports.isSameChannel = (guildId, channelId) => !!channelId
  && this.getChannelId(guildId) === channelId;

module.exports.getChannelId = guildId => getJukebox(guildId).connection?.joinConfig.channelId;

module.exports.isValidIndex = async (guildId, index) => !isNaN(index)
  && index >= 0 && index < await this.getSize(guildId);

module.exports.isConnected = guildId => !!getJukebox(guildId)?.connection
  && getJukebox(guildId).connection._state.status !== VoiceConnectionStatus.Destroyed;

module.exports.isLessQueue = (guildId, count) => this.getSize(guildId).then(size => size < count);

module.exports.playPlayer = async interaction => {
  this.createConnection(interaction);

  if (getJukebox(interaction.guildId).player.state.status !== AudioPlayerStatus.Idle) {
    return;
  }

  const target = await this.remove(interaction.guildId, 0);

  this.getNowPlaying(interaction.guildId).song = target;
  this.play(interaction.guildId);
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.PLAYER,
    message: t('inner:audit.player.play', {song: target.title}),
  });
};

module.exports.destroyConnection = async guildId => {
  getJukebox(guildId).connection.destroy();
  clearNowPlaying(guildId);
  await this.clearQueue(guildId);
  clearConnection(guildId);
};

const getJukebox = guildId => guildId
  ? jukeboxes.get(guildId)
  : null;

const setJukebox = (guildId, jukebox) => jukeboxes.set(guildId, jukebox);

const clearNowPlaying = guildId => {
  getJukebox(guildId).nowPlaying = {};
};

const clearConnection = guildId => {
  getJukebox(guildId).connection = null;
};

const createConnection = ({guildId, member: {voice: {channel}}}) => {
  if (getJukebox(guildId).connection && getJukebox(guildId).connection?._state.status !== VoiceConnectionStatus.Destroyed) {
    return;
  }

  getJukebox(guildId).connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
  getJukebox(guildId).connection.subscribe(this.getPlayer(guildId));
};

const getPlayer = guildId => {
  if (getJukebox(guildId).connection && !getJukebox(guildId).player) {
    const restarts = 0;

    getJukebox(guildId).player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Stop,
      },
    });

    getJukebox(guildId).player.on('error', this.onPlayerError(guildId, restarts));
    getJukebox(guildId).player.on(AudioPlayerStatus.Idle, this.onPlayerIdle(guildId));
  }

  return getJukebox(guildId).player;
};

const getAudioStream = song => {
  switch (song.type) {
    case SONG_TYPES.YOUTUBE:
      return getStream(song.url);
    case SONG_TYPES.RADIO:
      return song.url;
  }
};

const play = guildId => {
  this.getNowPlaying(guildId).resource = createAudioResource(getAudioStream(this.getNowPlaying(guildId).song));
  getJukebox(guildId).player.play(this.getNowPlaying(guildId).resource);
};

const onPlayerError = (guildId, restarts) => async error => {
  await audit({
    guildId,
    type: TYPES.ERROR,
    category: CATEGORIES.PLAYER,
    message: stringify(error),
  });

  if (error.resource.playbackDuration === 0 && restarts < 10) {
    setTimeout(async () => {
      this.play(guildId);
      await audit({
        guildId,
        type: TYPES.WARNING,
        category: CATEGORIES.PLAYER,
        message: t('inner:audit.player.play', {song: this.getNowPlaying(guildId).song.title}),
      });
    }, 250);
    restarts++;
  } else {
    restarts = 0;
  }
};

const onPlayerIdle = guildId => async oldState => {
  const nowPlaying = this.getNowPlaying(guildId);

  await audit({
    guildId,
    type: TYPES.DEBUG,
    category: CATEGORIES.PLAYER,
    message: t(
      'inner:audit.player.idle.finished',
      {
        current: timeFormatMilliseconds(oldState.playbackDuration) ?? t('common:player.overDay'),
        total: timeFormatSeconds(nowPlaying.song?.duration) ?? t('common:player.overDay'),
      },
    ),
  });

  if (nowPlaying.isLoop) {
    this.play(guildId);
    return;
  }

  if (await this.isLessQueue(guildId, 1)) {
    clearNowPlaying(guildId);
    await audit({
      guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PLAYER,
      message: t('inner:audit.player.idle.emptyQueue'),
    });
    return;
  }

  const target = await this.remove(guildId, 0);

  nowPlaying.song = target;
  this.play(guildId);
  await audit({
    guildId,
    type: TYPES.INFO,
    category: CATEGORIES.PLAYER,
    message: t('inner:audit.player.idle.play', {title: target.title}),
  });
};

module.exports.getJukebox = getJukebox;
module.exports.setJukebox = setJukebox;
module.exports.createConnection = createConnection;
module.exports.getPlayer = getPlayer;
module.exports.play = play;
module.exports.onPlayerError = onPlayerError;
module.exports.onPlayerIdle = onPlayerIdle;
