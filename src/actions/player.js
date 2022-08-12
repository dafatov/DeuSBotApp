const {
  createAudioPlayer, createAudioResource,
  AudioPlayerStatus, NoSubscriberBehavior
} = require("@discordjs/voice");
const ytdl = require('ytdl-core');
const {timeFormatSeconds, timeFormatmSeconds} = require("../utils/dateTime.js");
const {log, error, logGuild} = require('../utils/logger.js');
const {join} = require('./commands/join.js');
const config = require("../configs/config.js");
const {MessageEmbed} = require("discord.js");
const {notify} = require("./commands");

let client;

module.exports.init = (c) => {
  client = c;
  client.queue = new Map();
  client.guilds.cache.forEach(async guild => {
    client.queue.set(guild.id, {songs: [], nowPlaying: {}});
  });
  log(`Успешно зарегистрированы плееры для гильдий: [${client.guilds.cache.map(g => g.name).sort().join(', ')}]`)
}

module.exports.getQueue = (guildId) => {
  return guildId ? client?.queue.get(guildId) : null;
}

module.exports.skip = async (guildId) => {
  let skipped = this.getQueue(guildId).nowPlaying.song;

  this.clearNowPlaying(guildId);
  this.getQueue(guildId).nowPlaying.isSkip = true;
  this.getQueue(guildId).player.stop();
  if (this.getQueue(guildId).songs.length !== 0) {
    logGuild(guildId, `[play][Skip]: ${this.getQueue(guildId).songs[0].title}`);
    this.getQueue(guildId).nowPlaying.song = this.getQueue(guildId).songs[0];
    await play(guildId, false);
  }
  this.getQueue(guildId).nowPlaying.isSkip = false;
  return skipped;
}

module.exports.clearNowPlaying = (guildId) => {
  this.getQueue(guildId).nowPlaying = {};
}

module.exports.clearQueue = (guildId) => {
  this.getQueue(guildId).songs = [];
  this.getQueue(guildId).remained = 0;
}

module.exports.clearConnection = (guildId) => {
  delete this.getQueue(guildId).connection;
  delete this.getQueue(guildId).voiceChannel;
}

module.exports.hasLive = (queue) => {
  return (queue.nowPlaying?.song?.isLive ?? false) || (queue.songs?.filter(s => s.isLive).size ?? 0) > 0;
}

module.exports.playPlayer = async (interaction, isExecute) => {
  await join(interaction, isExecute);

  await createPlayer(interaction, interaction.guildId);

  if (this.getQueue(interaction.guildId).player.state.status !== AudioPlayerStatus.Playing) {
    logGuild(interaction.guildId, `[play][Inter]: ${this.getQueue(interaction.guildId).songs[0].title}`);
    this.getQueue(interaction.guildId).nowPlaying.song = this.getQueue(interaction.guildId).songs[0];
    play(interaction.guildId, false);
  }
}

const createPlayer = async (interaction, guildId) => {
  let timerId;
  try {
    if (this.getQueue(guildId).connection && !this.getQueue(guildId).player) {
      this.getQueue(guildId).player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Stop
        }
      });

      this.getQueue(guildId).player.on('error', (e) => {
        error(e.name + ': ' + e.message);
        try {
          if (e.resource.playbackDuration === 0) {
            timerId = setTimeout(async () => {
              logGuild(guildId, `[play][Error]: ${this.getQueue(guildId).nowPlaying.song.title}`);
              if (e.message === 'No such format found: highestaudio') {
                const embed = new MessageEmbed()
                  .setColor(config.colors.warning)
                  .setTitle('Говн\`о не играю')
                  .setDescription(`Не ну ты чо серьёзно? Ты бы еще из ж*пы пластинку достал. **Качество аудио высокого качества отсутствует, так что композиция будет пропущена**
                    Фекалии: _${this.getQueue(guildId).nowPlaying.song.title}_`)
                  .setTimestamp()
                await notify('player', interaction, {embeds: [embed]});
                await module.exports.skip(guildId)
                return;
              } else if (e.message === 'Cookie header used in request, but unable to find YouTube identity token') {
                const embed = new MessageEmbed()
                  .setColor(config.colors.error)
                  .setTitle("Проблемы с cookie")
                  .setDescription(
                    `Бот не сможет играть, так как cookie, установленные для него устарели. Пока что они устанавливаются вручную, но автор что-нибудь придумает когда ему не будет лень`)
                  .setTimestamp()
                await notify('player', interaction, {embeds: [embed]});
                await module.exports.skip(guildId)
                return;
              }
              play(guildId, true);
            }, 250);
          }
        } catch (e) {
          error(e)
        }
      });

      this.getQueue(guildId).player.on(AudioPlayerStatus.Idle, (a) => {
        if (this.getQueue(guildId).nowPlaying.isSkip) {
          this.getQueue(guildId).nowPlaying.isSkip = false;
          logGuild(guildId, '[play][Idle]: isSkip = false now');
          return;
        }

        let p = a.playbackDuration;
        if (this.getQueue(guildId).nowPlaying.song) {
          logGuild(guildId, `[play][Idle]: [${timeFormatmSeconds(p)}/${timeFormatSeconds(this.getQueue(guildId).nowPlaying.song.length)}] `);
          if (p === 0 || this.getQueue(guildId).nowPlaying.song.isLive) {
            timerId = setTimeout(() => {
              if (this.getQueue(guildId).nowPlaying.song) {
                logGuild(guildId, `[play][IdleError]: ${this.getQueue(guildId).nowPlaying.song.title}`);
                play(guildId, true);
              }
            }, 250);
            return;
          }
        }

        if (timerId && !timerId._destroyed) {
          return;
        }

        if (this.getQueue(guildId).nowPlaying.isLoop) {
          play(guildId, true);
          return;
        }

        if (this.getQueue(guildId).songs.length === 0) {
          logGuild(guildId, "[play][Idle]: cleared queue");
          module.exports.clearNowPlaying(guildId);
          return;
        }

        logGuild(guildId, `[play][Idle]: ${this.getQueue(guildId).songs[0].title}`);
        this.getQueue(guildId).nowPlaying.song = this.getQueue(guildId).songs[0];
        play(guildId, false);
      });
    }
    this.getQueue(guildId).connection.subscribe(this.getQueue(guildId).player);
  } catch (e) {
    error(e);
  }
}

const createAudioStream = (song) => {
  if (song.type === 'youtube') {
    return ytdl(song.url, {
      requestOptions: {
        headers: {
          cookie: process.env.COOKIE,
        },
      },
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25
    })
  } else if (song.type === 'radio') {
    return song.url;
  }
}

const play = async (guildId, isCurrent) => {
  this.getQueue(guildId).nowPlaying.resource = createAudioResource(createAudioStream(isCurrent
    ? this.getQueue(guildId).nowPlaying.song
    : this.getQueue(guildId).songs.shift()));
  if (!isCurrent) {
    this.getQueue(guildId).remained -= this.getQueue(guildId).nowPlaying.song.length;
  }
  await this.getQueue(guildId).player.play(this.getQueue(guildId).nowPlaying.resource);
}
