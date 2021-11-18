const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { validateURL } = require("ytdl-core");
const ytdl = require("ytdl-core");
const { log } = require("../../utils/logger.js");
const { timeFormatSeconds } = require("../../utils/converter.js");
const ytsr = require("ytsr");
const { getPlaylistID } = require("ytpl");
const ytpl = require("ytpl");
const { notify, notifyError } = require("../commands.js");
const config = require("../../configs/config.js");
const { playPlayer } = require("../player.js");
const { escaping } = require("../../utils/string.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Воспроизвести в боте аудио')
        .addStringOption(o => o
            .setName('audio')
            .setDescription('Url или наименование видео записи с youtube')
            .setRequired(true)),
    async execute(interaction) {
        await play(interaction, interaction.options.getString('audio'));
    },
    async listener(interaction) {}
}

const play = async (interaction, audio) => {
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
                error(e);
                return;
            });
        }).catch(() => {
            if (validateURL(audio)) {
                ytdl.getBasicInfo(audio).then(async i => {
                    await notifySong(interaction, addQueue(interaction, i));
                    await playPlayer(interaction);
                }).catch(err => {throw err})
            } else {
                ytsr(audio, {
                    gl: 'RU',
                    hl: 'ru',
                    limit: 20
                }).then(async r => {
                    if (r.items.length === 0) throw "Ничего не найдено";
                    let w = 0;
                    while (w < 20) {
                        await ytdl.getBasicInfo(r.items[w].url).then(async i => {
                            await notifySong(interaction, addQueue(interaction, i));
                            await playPlayer(interaction);
                            w = 21;
                        }).catch((e) => {
                            w++;
                        })
                    }
                }).catch(err => {throw err})
            }
        });
    } catch (e) {
        notifyError('play', e, interaction);
        error(e);
        return;
    }
}

const playPlaylist = async (interaction, p) => {
    let info;
    p.items.forEach(i => {
        info = {
            title: i.title,
            length: i.durationSec,
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
    await notifyPlaylist(interaction, info);
}

const addQueue = (interaction, i) => {
    let info = {
        title: i.videoDetails.title,
        length: i.videoDetails.lengthSeconds,
        url: i.videoDetails.video_url,
        isLive: i.videoDetails.isLiveContent,
        preview: i.videoDetails.thumbnails[0].url
    };
    interaction.client.queue.songs.push(info);
    return info;
}

module.exports.searchSongs = async (interaction, audios, login) => {
    for (let a of audios) {
        await ytsr(a, {
            gl: 'RU',
            hl: 'ru',
            limit: 20
        }).then(async r => {
            if (r.items.length === 0) throw "Ничего не найдено";
            let w = 0;
            while (w < 20) {
                await ytdl.getBasicInfo(r.items[w].url).then(async i => {
                    addQueue(interaction, i);
                    w = 21;
                }).catch((e) => {
                    w++;
                })
            }
        }).catch(err => {throw err})
    };

    let info = {
        title: `Композиции профиля ${login}`,
        length: `${audios.length}`,
        url: `https://shikimori.one/${login}`,
        preview: 'https://yt3.ggpht.com/a/AGF-l78770kCZ2R6kvd35ixM3QhDCC3B7RaHiWoghw=s900-c-k-c0xffffffff-no-rj-mo'
    };
    await notifyPlaylist(interaction, info);
    await playPlayer(interaction);
}

const notifySong = async (interaction, info) => {
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(escaping(info.title))
        .setURL(info.url)
        .setDescription(`Длительность: **${info.isLive ? 
            '<Стрим>' : timeFormatSeconds(info.length)}**
            Место в очереди: **${interaction.client.queue.songs.length}**`)
        .setThumbnail(info.preview)
        .setTimestamp()
        .setFooter(`Композицию заказал пользователь ${interaction.user.username}`);
    await notify('play', interaction, {embeds: [embed]});
    log(`[play.add] Композиция успешно добавлена в очередь`);
}

const notifyPlaylist = async (interaction, info) => {
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(escaping(info.title))
        .setURL(info.url)
        .setDescription(`Количество композиций: **${info.length}**`)
        .setThumbnail(info.preview)
        .setTimestamp()
        .setFooter(`Плейлист предложил пользователь ${interaction.user.username}`);
    await notify('play', interaction, {embeds: [embed]});
    log(`[play.add] Плейлист успешно добавлен в очередь`);
}