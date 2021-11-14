const { SlashCommandBuilder } = require("@discordjs/builders");
const { createAudioPlayer, createAudioResource,
    AudioPlayerStatus, NoSubscriberBehavior } = require("@discordjs/voice");
const { MessageEmbed } = require("discord.js");
const { validateURL } = require("ytdl-core");
const ytdl = require("ytdl-core");
const { log, error } = require("../../utils/logger.js");
const { join } = require("./join.js");
const { timeFormatSeconds, timeFormatmSeconds } = require("../../utils/converter.js");
const ytsr = require("ytsr");
const { getPlaylistID } = require("ytpl");
const ytpl = require("ytpl");
const { notify, notifyError } = require("../commands.js");
const config = require("../../configs/config.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Воспроизвести в боте аудио')
        .addStringOption(o => o
            .setName('audio')
            .setDescription('Url или наименование видео записи с youtube')
            .setRequired(true)),
    async execute(interaction) {
        await play(interaction);
    },
    async listener(interaction) {}
}

const play = async (interaction) => {
    const audio = interaction.options.getString('audio');

    if (interaction.client.queue.connection &&
        interaction.client.queue.connection.joinConfig.channelId !==
            interaction.member.voice.channel.id) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Канал не тот')
            .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
            .setTimestamp();
        await notify('play', interaction, {embeds: [embed]});
        log(`[play] Добавить композицию не вышло: не совпадают каналы`);
        return;
    }

    try {
        getPlaylistID(audio).then(async a => {
            ytpl(a).then(async p => {
                await playPlaylist(interaction, p);
                await playPlayer(interaction);
            }).catch(async e => {
                notifyError('play', e, interaction);
                return;
            });
        }).catch(() => {
            if (validateURL(audio)) {
                ytdl.getBasicInfo(audio).then(async i => {
                    await playUrl(interaction, i);
                    await playPlayer(interaction);
                }).catch(err => {throw err})
            } else {
                ytsr(audio, {
                    gl: 'RU',
                    hl: 'ru',
                    limit: 1
                }).then(async r => {
                    if (r.items.length === 0) throw "Ничего не найдено";
                    ytdl.getBasicInfo(r.items[0].url).then(async i => {
                        await playUrl(interaction, i);
                        await playPlayer(interaction);
                    }).catch(err => {throw err})
                }).catch(err => {throw err})
            }
        });
    } catch (e) {
        notifyError('play', e, interaction);
        return;
    }
}

const playPlaylist = async (interaction, p) => {
    let info;
    p.items.forEach(i => {
        info = {
            title: i.title,
            length: timeFormatSeconds(i.durationSec),
            url: i.shortUrl,
            isLive: i.isLive,
            preview: i.thumbnails[0].url
        };
        interaction.client.queue.songs.push(info);
    });

    info = {
        title: p.title,
        length: `${p.estimatedItemCount}`,
        url: p.url,
        preview: p.thumbnails[0].url
    };
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(info.title)
        .setURL(info.url)
        .setDescription(`Количество композиций: ${info.length}`)
        .setThumbnail(info.preview)
        .setTimestamp()
        .setFooter(`Плейлист предложил пользователь ${interaction.user.username}`);
    await notify('play', interaction, {embeds: [embed]});
    log(`[play.add] Плейлист успешно добавлен в очередь`);
}

const playUrl = async (interaction, i) => {
    let info = {
        title: i.videoDetails.title,
        length: timeFormatSeconds(i.videoDetails.lengthSeconds),
        url: i.videoDetails.video_url,
        isLive: i.videoDetails.isLiveContent,
        preview: i.videoDetails.thumbnails[0].url
    };
    interaction.client.queue.songs.push(info);

    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(info.title)
        .setURL(info.url)
        .setDescription(`Длительность: ${info.isLive ? 
            '<Стрим>' : info.length}`)
        .setThumbnail(info.preview)
        .setTimestamp()
        .setFooter(`Композицию заказал пользователь ${interaction.user.username}`);
    await notify('play', interaction, {embeds: [embed]});
    log(`[play.add] Композиция успешно добавлена в очередь`);
}

const playPlayer = async (interaction) => {
    if (!interaction.client.queue.connection) await join(interaction);
    if (interaction.client.queue.connection && !interaction.client.queue.player) {
        interaction.client.queue.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Stop
            }
        });
        interaction.client.queue.connection.subscribe(interaction.client.queue.player);
        interaction.client.queue.player.on('error', (e) => {
            log(e);
            try {
                if (e.resource.playbackDuration === 0) {
                    log(`[play][Error]: ${interaction.client.queue.nowPlaying.title}`);
                    interaction.client.queue.player.play(createAudioResource(ytdl(interaction.client.queue.nowPlaying.url, {
                        requestOptions: {
                            headers: {
                            cookie: config.cookie,
                            },
                        },
                        filter: 'audioonly', 
                        quality: 'highestaudio',
                        highWaterMark: 1 << 25
                    })));
                }
            } catch (e) {
                error(e)
            }
        });
        interaction.client.queue.player.on(AudioPlayerStatus.Idle, (a, b) => {
            let p = a.playbackDuration
            log(`[play]: [${timeFormatmSeconds(p)}/${interaction.client.queue.nowPlaying.length}] `);
            log(`[play][Event]: ${interaction.client.queue.songs[0].title}`);

            if (interaction.client.queue.songs.length === 0) return;

            interaction.client.queue.nowPlaying = interaction.client.queue.songs[0];
            interaction.client.queue.player.play(createAudioResource(ytdl(interaction.client.queue.songs.shift().url, {
                requestOptions: {
                    headers: {
                      cookie: config.cookie,
                    },
                },
                filter: 'audioonly', 
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            })));
        })
    }
    if (interaction.client.queue.player.state.status !== AudioPlayerStatus.Playing) {
        log(`[play][Inter]: ${interaction.client.queue.songs[0].title}`);
        interaction.client.queue.nowPlaying = interaction.client.queue.songs[0];
        interaction.client.queue.player.play(createAudioResource(ytdl(interaction.client.queue.songs.shift().url, {
            requestOptions: {
                headers: {
                  cookie: config.cookie,
                },
            },
            filter: 'audioonly', 
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        })));
    }
}