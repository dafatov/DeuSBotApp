const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const { logGuild } = require("../../utils/logger.js");
const { timeFormatSeconds, timeFormatmSeconds } = require("../../utils/converter.js");
const ytsr = require("ytsr");
const ytpl = require("ytpl");
const { notify, notifyError } = require("../commands.js");
const config = require("../../configs/config.js");
const { playPlayer, getQueue, hasLive } = require("../player.js");
const { escaping } = require("../../utils/string.js");
const progressBar = require('string-progressbar');
const { remained } = require("../../utils/calc.js");


const options = {
    requestOptions: {
        headers: {
            cookie: config.cookie
        }
    }
};

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
    if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
        && getQueue(interaction.guildId).connection.joinConfig.channelId !==
            interaction.member.voice.channel.id) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Канал не тот')
            .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
            .setTimestamp();
        await notify('play', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[play]: Добавить композицию не вышло: не совпадают каналы`);
        return;
    }

    try {
        ytpl.getPlaylistID(audio).then(async a => {
            ytpl(a, {limit: Infinity, ...options}).then(async p => {
                await playPlaylist(interaction, p);
                await playPlayer(interaction);
            }).catch(async e => {
                notifyError('play', e, interaction);
                return;
            });
        }).catch(() => {
            if (ytdl.validateURL(audio)) {
                ytdl.getBasicInfo(audio, options).then(async i => {
                    await notifySong(interaction, addQueue(interaction, i));
                    await playPlayer(interaction);
                }).catch(err => {throw err})
            } else {
                ytsr(audio, {
                    gl: 'RU',
                    hl: 'ru',
                    limit: 10
                }, options).then(async r => {
                    if (r.items.length === 0) throw "Ничего не найдено";
                    let w = 0;
                    while (w < 10) {
                        await ytdl.getBasicInfo(r.items[w].url, options).then(async i => {
                            await notifySong(interaction, addQueue(interaction, i));
                            await playPlayer(interaction);
                            w = 11;
                        }).catch(() => {
                            w++;
                        })
                    }
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
    let allLength = 0;
    p.items.forEach(i => {
        info = {
            type: 'youtube',
            title: i.title,
            length: i.durationSec,
            url: i.shortUrl,
            isLive: i.isLive,
            preview: i.thumbnails[0].url,
            author: interaction.user
        };
        getQueue(interaction.guildId).songs.push(info);
        allLength += parseInt(info.length);
    });

    info = {
        title: p.title,
        length: `${p.estimatedItemCount}`,
        duration: allLength,
        url: p.url,
        preview: p.thumbnails[0].url
    };
    await notifyPlaylist(interaction, info);
}

const addQueue = (interaction, i) => {
    let info = {
        type: 'youtube',
        title: i.videoDetails.title,
        length: i.videoDetails.lengthSeconds,
        url: i.videoDetails.video_url,
        isLive: i.videoDetails.isLiveContent,
        preview: i.videoDetails.thumbnails[0].url,
        author: interaction.user
    };
    getQueue(interaction.guildId).songs.push(info);
    return info;
}

module.exports.searchSongs = async (interaction, audios, login) => {
    let i = 0;
    let barString = progressBar.filledBar(audios.length, i);
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle('Прогресс формирования')
        .setDescription(`${barString[0]} [${Math.round(barString[1])}%]`);
    let intervalId = setInterval(async () => {
        barString = progressBar.filledBar(audios.length, i);
        embed.setDescription(`${barString[0]} [${Math.round(barString[1])}%]`);
        try {
            await interaction.editReply({embeds: [embed]});
        } catch (e) {
            clearInterval(this);
            intervalId = null;
        }
    }, 1000);

    let allLength = 0
    Promise.all(audios.map((a) => ytsr(a, {
        gl: 'RU',
        hl: 'ru',
        limit: 10
    }, options).then(async r => {
        if (r.items.length === 0) throw "Ничего не найдено";

        let w = 0;
        while (w < 10) {
            await ytdl.getBasicInfo(r.items[w].url, options).then(async i => {
                allLength += parseInt(addQueue(interaction, i).length);
                w = 11;
            }).catch(() => {
                w++;
            })
        }
        i++;
    }))).then(async () => {
        clearInterval(intervalId);
        
        const remainedValue = remained(getQueue(interaction.guildId));
        getQueue(interaction.guildId).remained = (getQueue(interaction.guildId).remained ?? 0) + allLength;
        embed.setTitle(escaping(`Композиции профиля ${login}`))
            .setURL(`https://shikimori.one/${login}/list/anime/mylist/completed,watching/order-by/ranked`)
            .setDescription(`Количество композиций: **${audios.length}**
                Общая длительность: **${timeFormatSeconds(allLength)}**
                Начнется через: **${hasLive(getQueue(interaction.guildId)) ? '<Никогда>' : remainedValue === 0 ? '<Сейчас>' : timeFormatmSeconds(remainedValue)}**`)
            .setThumbnail('https://i.ibb.co/PGFbnkS/Afk-W8-Fi-E-400x400.png')
            .setTimestamp()
            .setFooter(`Плейлист создал ${interaction.user.username}`, interaction.user.displayAvatarURL());
        await interaction.editReply({embeds: [embed]});
        await playPlayer(interaction);
    })
}

const notifySong = async (interaction, info) => {
    const remainedValue = remained(getQueue(interaction.guildId));
    getQueue(interaction.guildId).remained = (getQueue(interaction.guildId).remained ?? 0) + parseInt(info.length);
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(escaping(info.title))
        .setURL(info.url)
        .setDescription(`Длительность: **${info.isLive ? 
            '<Стрим>' : timeFormatSeconds(info.length)}**
            Место в очереди: **${getQueue(interaction.guildId).songs.length}**
            Начнется через: **${hasLive(getQueue(interaction.guildId)) ? '<Никогда>' : remainedValue === 0 ? '<Сейчас>' : timeFormatmSeconds(remainedValue)}**`)
        .setThumbnail(info.preview)
        .setTimestamp()
        .setFooter(`Композицию заказал пользователь ${interaction.user.username}`, interaction.user.displayAvatarURL());
    await notify('play', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[play][add]: Композиция успешно добавлена в очередь`);
}

const notifyPlaylist = async (interaction, info) => {
    const remainedValue = remained(getQueue(interaction.guildId));
    getQueue(interaction.guildId).remained = (getQueue(interaction.guildId).remained ?? 0) + parseInt(info.duration);
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(escaping(info.title))
        .setURL(info.url)
        .setDescription(`Количество композиций: **${info.length}**
            Общая длительность: **${timeFormatSeconds(info.duration)}**
            Начнется через: **${hasLive(getQueue(interaction.guildId)) ? '<Никогда>' : remainedValue === 0 ? '<Сейчас>' : timeFormatmSeconds(remainedValue)}**`)
        .setThumbnail(info.preview)
        .setTimestamp()
        .setFooter(`Плейлист предложил пользователь ${interaction.user.username}`, interaction.user.displayAvatarURL());
    await notify('play', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[play][add]: Плейлист успешно добавлен в очередь`);
}