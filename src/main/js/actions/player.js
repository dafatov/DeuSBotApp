const {AudioPlayerStatus, NoSubscriberBehavior, VoiceConnectionStatus, createAudioPlayer, createAudioResource, joinVoiceChannel} = require('@discordjs/voice');
const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {arrayMove, shuffleArray} = require('../utils/array');
const {timeFormatMilliseconds, timeFormatSeconds} = require('../utils/dateTime');
const {audit} = require('./auditor');
const {stringify} = require('../utils/string');
const {t} = require('i18next');
const ytdl = require('ytdl-core');

let client;

module.exports.options = () => ({
  requestOptions: {
    headers: {
      Cookie: process.env.YOUTUBE_COOKIE,
      'x-youtube-identity-token': process.env.YOUTUBE_ID_TOKEN,
    },
  },
});

module.exports.init = async c => {
  client = c;
  client.queue = new Map();

  await client.guilds.fetch()
    .then(guilds => {
      guilds.forEach(guild =>
        client.queue.set(guild.id, {songs: [], nowPlaying: {}}));
      return guilds;
    }).then(guilds => guilds.map(guild => guild.name))
    .then(guilds => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.INIT,
      message: t('inner:audit.init.player', {guilds}),
    }));
};

module.exports.getQueue = guildId => {
  return guildId
    ? client?.queue.get(guildId)
    : null;
};

module.exports.addQueue = (guildId, added) => {
  this.getQueue(guildId).songs.push(...added.songs);
  this.getQueue(guildId).remained = (this.getQueue(guildId).remained ?? 0) + added.info.duration;
};

module.exports.removeQueue = (guildId, index) => {
  const target = this.getQueue(guildId).songs[index];

  this.getQueue(guildId).songs.splice(index, 1);
  this.getQueue(guildId).remained -= target.length;

  return target;
};

module.exports.moveQueue = (guildId, targetIndex, positionIndex) => {
  const target = this.getQueue(guildId).songs[targetIndex];

  arrayMove(this.getQueue(guildId).songs, targetIndex, positionIndex);

  return target;
};

module.exports.skip = async guildId => {
  const skipped = this.getQueue(guildId).nowPlaying.song;

  this.clearNowPlaying(guildId);
  this.getQueue(guildId).nowPlaying.isSkip = true;
  this.getQueue(guildId).player.stop();
  if (this.getQueue(guildId).songs.length !== 0) {
    await audit({
      guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PLAYER,
      message: t('inner:audit.player.skip', {song: this.getQueue(guildId).songs[0].title}),
    });
    this.getQueue(guildId).nowPlaying.song = this.getQueue(guildId).songs[0];
    await play(guildId, false);
  }
  this.getQueue(guildId).nowPlaying.isSkip = false;
  return skipped;
};

module.exports.loop = guildId => {
  this.getQueue(guildId).nowPlaying.isLoop = !this.getQueue(guildId).nowPlaying.isLoop;
  return this.getQueue(guildId).nowPlaying.isLoop;
};

module.exports.pause = guildId => {
  if (this.getQueue(guildId).nowPlaying.isPause) {
    this.getQueue(guildId).player.unpause();
  } else {
    this.getQueue(guildId).player.pause();
  }
  this.getQueue(guildId).nowPlaying.isPause = !this.getQueue(guildId).nowPlaying.isPause;

  return this.getQueue(guildId).nowPlaying.isPause;
};

module.exports.shuffle = guildId => shuffleArray(this.getQueue(guildId).songs);

module.exports.clearNowPlaying = guildId => {
  this.getQueue(guildId).nowPlaying = {};
};

module.exports.clearQueue = guildId => {
  this.getQueue(guildId).songs = [];
  this.getQueue(guildId).remained = 0;
};

module.exports.clearConnection = guildId => {
  delete this.getQueue(guildId).connection;
  delete this.getQueue(guildId).voiceChannel;
};

module.exports.hasLive = queue => {
  return (queue.nowPlaying?.song?.isLive ?? false) || (queue.songs?.filter(s => s.isLive).length ?? 0) > 0;
};

module.exports.isEmptyQueue = guildId => this.isLessQueue(guildId, 0);

module.exports.isPlaying = guildId => !!this.getQueue(guildId).nowPlaying?.song;

module.exports.isPlayingLive = guildId => !!this.getQueue(guildId).nowPlaying?.song.isLive;

module.exports.isSameChannel = interaction => !!interaction.member.voice.channel?.id
  && this.getQueue(interaction.guildId).connection?.joinConfig.channelId === interaction.member.voice.channel?.id;

module.exports.isValidIndex = (guildId, index) => !isNaN(index)
  && index >= 0 && index < this.getQueue(guildId).songs.length;

module.exports.isConnected = guildId => !!this.getQueue(guildId).connection;

module.exports.isLessQueue = (guildId, count) => (this.getQueue(guildId).songs?.length ?? 0) < count;

module.exports.playPlayer = async interaction => {
  this.createConnection(interaction);

  await createPlayer(interaction, interaction.guildId);

  if (this.getQueue(interaction.guildId).player.state.status !== AudioPlayerStatus.Playing) {
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PLAYER,
      message: t('inner:audit.player.play', {song: this.getQueue(interaction.guildId).songs[0].title}),
    });
    this.getQueue(interaction.guildId).nowPlaying.song = this.getQueue(interaction.guildId).songs[0];
    await play(interaction.guildId, false);
  }
};

module.exports.createConnection = interaction => {
  if (this.getQueue(interaction.guildId)?.connection
    && this.getQueue(interaction.guildId)?.connection?._state.status !== VoiceConnectionStatus.Destroyed) {
    return;
  }

  const voiceChannel = interaction.member.voice.channel;

  this.getQueue(interaction.guildId).connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });
  this.getQueue(interaction.guildId).voiceChannel = voiceChannel;
};

const createPlayer = async (interaction, guildId) => {
  let timerId;

  try {
    if (this.getQueue(guildId).connection && !this.getQueue(guildId).player) {
      this.getQueue(guildId).player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Stop,
        },
      });

      this.getQueue(guildId).player.on('error', async e => {
        await audit({
          guildId,
          type: TYPES.ERROR,
          category: CATEGORIES.PLAYER,
          message: stringify(e),
        });

        if (e.resource.playbackDuration === 0) {
          timerId = setTimeout(async () => {
            if (this.isPlaying(guildId)) {
              await audit({
                guildId,
                type: TYPES.WARNING,
                category: CATEGORIES.PLAYER,
                message: t('inner:audit.player.play', {song: this.getQueue(guildId).nowPlaying.song.title}),
              });
              await play(guildId, true);
            }
          }, 250);
        }
      });

      this.getQueue(guildId).player.on(AudioPlayerStatus.Idle, async a => {
        if (this.getQueue(guildId).nowPlaying.isSkip) {
          this.getQueue(guildId).nowPlaying.isSkip = false;
          await audit({
            guildId,
            type: TYPES.INFO,
            category: CATEGORIES.PLAYER,
            message: t('inner:audit.player.idle.skip'),
          });
          return;
        }

        const p = a.playbackDuration;
        if (this.getQueue(guildId).nowPlaying.song) {
          await audit({
            guildId,
            type: TYPES.DEBUG,
            category: CATEGORIES.PLAYER,
            message: t(
              'inner:audit.player.idle.finished',
              {current: timeFormatMilliseconds(p), total: timeFormatSeconds(this.getQueue(guildId).nowPlaying.song.duration)},
            ),
          });

          if (p === 0 || this.getQueue(guildId).nowPlaying.song?.isLive) {
            timerId = setTimeout(async () => {
              if (this.getQueue(guildId).nowPlaying.song) {
                await audit({
                  guildId,
                  type: TYPES.ERROR,
                  category: CATEGORIES.PLAYER,
                  message: t('inner:audit.player.idle.error', {title: this.getQueue(guildId).nowPlaying.song.title}),
                });
                await play(guildId, true);
              }
            }, 250);
            return;
          }
        }

        if (timerId && !timerId._destroyed) {
          return;
        }

        if (this.getQueue(guildId).nowPlaying.isLoop) {
          await play(guildId, true);
          return;
        }

        if (this.getQueue(guildId).songs.length === 0) {
          await audit({
            guildId,
            type: TYPES.INFO,
            category: CATEGORIES.PLAYER,
            message: t('inner:audit.player.idle.emptyQueue'),
          });
          module.exports.clearNowPlaying(guildId);
          return;
        }

        await audit({
          guildId,
          type: TYPES.INFO,
          category: CATEGORIES.PLAYER,
          message: t('inner:audit.player.idle.play', {title: this.getQueue(guildId).songs[0].title}),
        });
        this.getQueue(guildId).nowPlaying.song = this.getQueue(guildId).songs[0];
        await play(guildId, false);
      });
    }
    this.getQueue(guildId).connection.subscribe(this.getQueue(guildId).player);
  } catch (e) {
    await audit({
      guildId,
      type: TYPES.ERROR,
      category: CATEGORIES.PLAYER,
      message: stringify(e),
    });
  }
};

const createAudioStream = song => {
  if (song.type === 'youtube') {
    return ytdl(song.url, {
      ...this.options(),
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    });
  } else if (song.type === 'radio') {
    return song.url;
  }
};

const play = async (guildId, isCurrent) => {
  this.getQueue(guildId).nowPlaying.resource = createAudioResource(createAudioStream(isCurrent
    ? this.getQueue(guildId).nowPlaying.song
    : this.getQueue(guildId).songs.shift()));
  if (!isCurrent) {
    this.getQueue(guildId).remained -= this.getQueue(guildId).nowPlaying.song.duration;
  }
  await this.getQueue(guildId).player.play(this.getQueue(guildId).nowPlaying.resource);
};
