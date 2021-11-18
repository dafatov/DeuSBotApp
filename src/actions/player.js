const { createAudioPlayer, createAudioResource,
    AudioPlayerStatus, NoSubscriberBehavior } = require("@discordjs/voice");
const ytdl = require('ytdl-core');
const { timeFormatSeconds, timeFormatmSeconds } = require("../utils/converter.js");
const { log, error } = require('../utils/logger.js');
const { join } = require('./commands/join.js');
const config = require("../configs/config.js");

module.exports.init = (client) => {
    client.queue = {
        connection: null,
        voiceChannel: null,
        player: null,
        nowPlaying: {
            song: null,
            resource: null
        },
        songs: []
    }
    log(`Успешно зарегистрирован плеер`)
}

module.exports.clear = (client) => {
    client.queue.nowPlaying = {
        song: null,
        resource: null
    }
}

module.exports.playPlayer = async (interaction) => {
    if (!interaction.client.queue.connection) await join(interaction);

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
            client.queue.connection.subscribe(client.queue.player);

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
                let p = a.playbackDuration;
                if (client.queue.nowPlaying.song) {
                    log(`[play]: [${timeFormatmSeconds(p)}/${timeFormatSeconds(client.queue.nowPlaying.song.length)}] `);
                    if (p === 0) {
                        timerId = setTimeout(() => {
                            log(`[play][IdleError]: ${client.queue.nowPlaying.song.title}`);
                            play(client.queue, true);
                        }, 250);
                        return;
                    }
                }

                if (timerId && !timerId._destroyed) return;

                if (client.queue.songs.length === 0) {
                    log("[play][Idle]: cleared queue");
                    module.exports.clear(client);
                    return;
                }

                log(`[play][Event]: ${client.queue.songs[0].title}`);
                client.queue.nowPlaying.song = client.queue.songs[0];
                play(client.queue, false);
            })
        }
    } catch (e) {
        error(e);
    }
}

const play = (queue, isCurrent) => {
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
    queue.player.play(queue.nowPlaying.resource);
}