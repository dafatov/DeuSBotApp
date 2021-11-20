const { createAudioPlayer, createAudioResource,
    AudioPlayerStatus, NoSubscriberBehavior } = require("@discordjs/voice");
const ytdl = require('ytdl-core');
const { timeFormatSeconds, timeFormatmSeconds } = require("../utils/converter.js");
const { log, error } = require('../utils/logger.js');
const { join } = require('./commands/join.js');
const config = require("../configs/config.js");

let isSkip = false;

module.exports.init = (client) => {
    client.queue = {
        connection: null,
        voiceChannel: null,
        player: null,
        nowPlaying: {
            song: null,
            resource: null,
            isLoop: false,
            isPause: false
        },
        songs: []
    }
    log(`Успешно зарегистрирован плеер`)
}

module.exports.skip = async (client) => {
    let skipped = client.queue.nowPlaying.song;
    
    module.exports.clearNowPlaying(client);
    isSkip = true;
    await client.queue.player.stop();
    if (client.queue.songs.length !== 0) {
        log(`[play][Skip]: ${client.queue.songs[0].title}`);
        client.queue.nowPlaying.song = client.queue.songs[0];
        await play(client.queue, false);
    } else {
        log("[play][Skip]: cleared queue");
    }
    isSkip = false;
    return skipped;
}

module.exports.clearNowPlaying = (client) => {
    client.queue.nowPlaying = {
        song: null,
        resource: null,
        isLoop: false,
        isPause: false
    };
}

module.exports.clearQueue = (client) => {
    client.queue.songs = [];
}

module.exports.playPlayer = async (interaction) => {
    await join(interaction);

    createPlayer(interaction.client);
    
    if (interaction.client.queue.player.state.status !== AudioPlayerStatus.Playing) {
        log(`[play][Inter]: ${interaction.client.queue.songs[0].title}`);
        interaction.client.queue.nowPlaying.song = interaction.client.queue.songs[0];
        play(interaction.client.queue, false);
    }
}

const createPlayer = (client) => {
    let timerId;
    try {
        if (client.queue.connection && !client.queue.player) {
            client.queue.player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Stop
                }
            });

            client.queue.player.on('error', (e) => {
                log(e);
                try {
                    if (e.resource.playbackDuration === 0) {
                        timerId = setTimeout(() => {
                            log(`[play][Error]: ${client.queue.nowPlaying.song.title}`);
                            play(client.queue, true);
                        }, 250);
                    }
                } catch (e) {
                    error(e)
                }
            });

            client.queue.player.on(AudioPlayerStatus.Idle, (a, b) => {
                if (isSkip) {
                    isSkip = false;
                    log('[play][Idle]: isSkip = false now');
                    return;
                }

                let p = a.playbackDuration;
                if (client.queue.nowPlaying.song) {
                    log(`[play][Idle]: [${timeFormatmSeconds(p)}/${timeFormatSeconds(client.queue.nowPlaying.song.length)}] `);
                    if (p === 0) {
                        timerId = setTimeout(() => {
                            log(`[play][IdleError]: ${client.queue.nowPlaying.song.title}`);
                            play(client.queue, true);
                        }, 250);
                        return;
                    }
                }

                if (timerId && !timerId._destroyed) return;

                if (client.queue.nowPlaying.isLoop) {
                    play(client.queue, true);
                    return;
                }

                if (client.queue.songs.length === 0) {
                    log("[play][Idle]: cleared queue");
                    module.exports.clearNowPlaying(client);
                    return;
                }

                log(`[play][Idle]: ${client.queue.songs[0].title}`);
                client.queue.nowPlaying.song = client.queue.songs[0];
                play(client.queue, false);
            })
        }
        client.queue.connection.subscribe(client.queue.player);
    } catch (e) {
        error(e);
    }
}

const play = async (queue, isCurrent) => {
    queue.nowPlaying.resource = createAudioResource(ytdl(isCurrent
        ? queue.nowPlaying.song.url
        : queue.songs.shift().url, {
            requestOptions: {
                headers: {
                cookie: config.cookie,
                },
            },
            filter: 'audioonly', 
            quality: 'highestaudio',
            highWaterMark: 1 << 25
    }));
    await queue.player.play(queue.nowPlaying.resource);
}