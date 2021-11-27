const { createAudioPlayer, createAudioResource,
    AudioPlayerStatus, NoSubscriberBehavior } = require("@discordjs/voice");
const ytdl = require('ytdl-core');
const { timeFormatSeconds, timeFormatmSeconds } = require("../utils/converter.js");
const { log, error, logGuild } = require('../utils/logger.js');
const { join } = require('./commands/join.js');
const config = require("../configs/config.js");

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
    return client?.queue.get(guildId);
}

module.exports.skip = async (guildId) => {
    let skipped = this.getQueue(guildId).nowPlaying.song;
    
    this.clearNowPlaying(guildId);
    this.getQueue(guildId).nowPlaying.isSkip = true;
    await this.getQueue(guildId).player.stop();
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
}

module.exports.clearConnection = (guildId) => {
    delete this.getQueue(guildId).connection;
    delete this.getQueue(guildId).voiceChannel;
}

module.exports.playPlayer = async (interaction) => {
    await join(interaction);

    createPlayer(interaction.guildId);
    
    if (this.getQueue(interaction.guildId).player.state.status !== AudioPlayerStatus.Playing) {
        logGuild(interaction.guildId, `[play][Inter]: ${this.getQueue(interaction.guildId).songs[0].title}`);
        this.getQueue(interaction.guildId).nowPlaying.song = this.getQueue(interaction.guildId).songs[0];
        play(interaction.guildId, false);
    }
}

const createPlayer = (guildId) => {
    let timerId;
    try {
        if (this.getQueue(guildId).connection && !this.getQueue(guildId).player) {
            this.getQueue(guildId).player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Stop
                }
            });

            this.getQueue(guildId).player.on('error', (e) => {
                error(e);
                try {
                    if (e.resource.playbackDuration === 0) {
                        timerId = setTimeout(() => {
                            logGuild(guildId, `[play][Error]: ${this.getQueue(guildId).nowPlaying.song.title}`);
                            play(guildId, true);
                        }, 250);
                    }
                } catch (e) {
                    error(e)
                }
            });

            this.getQueue(guildId).player.on(AudioPlayerStatus.Idle, (a, b) => {
                if (this.getQueue(guildId).nowPlaying.isSkip) {
                    this.getQueue(guildId).nowPlaying.isSkip = false;
                    logGuild(guildId, '[play][Idle]: isSkip = false now');
                    return;
                }

                let p = a.playbackDuration;
                if (this.getQueue(guildId).nowPlaying.song) {
                    logGuild(guildId, `[play][Idle]: [${timeFormatmSeconds(p)}/${timeFormatSeconds(this.getQueue(guildId).nowPlaying.song.length)}] `);
                    if (p === 0) {
                        timerId = setTimeout(() => {
                            if (this.getQueue(guildId).nowPlaying.song) {
                                logGuild(guildId, `[play][IdleError]: ${this.getQueue(guildId).nowPlaying.song.title}`);
                                play(guildId, true);
                            }
                        }, 250);
                        return;
                    }
                }

                if (timerId && !timerId._destroyed) return;

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
            })
        }
        this.getQueue(guildId).connection.subscribe(this.getQueue(guildId).player);
    } catch (e) {
        error(e);
    }
}

const play = async (guildId, isCurrent) => {
    this.getQueue(guildId).nowPlaying.resource = createAudioResource(ytdl(isCurrent
        ? this.getQueue(guildId).nowPlaying.song.url
        : this.getQueue(guildId).songs.shift().url, {
            requestOptions: {
                headers: {
                cookie: config.cookie,
                },
            },
            filter: 'audioonly', 
            quality: 'highestaudio',
            highWaterMark: 1 << 25
    }));
    if (!isCurrent) this.getQueue(guildId).remained -= this.getQueue(guildId).nowPlaying.song.length;
    await this.getQueue(guildId).player.play(this.getQueue(guildId).nowPlaying.resource);
}