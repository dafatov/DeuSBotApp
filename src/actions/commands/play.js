const { SlashCommandBuilder } = require("@discordjs/builders");
const { createAudioPlayer, createAudioResource,
    AudioPlayerStatus, NoSubscriberBehavior } = require("@discordjs/voice");
const { MessageEmbed } = require("discord.js");
const { validateURL } = require("ytdl-core");
const ytdl = require("ytdl-core");
const { log, error } = require("../../utils/logger.js");
const { join } = require("./join.js");
const { timeFormat } = require("../../utils/converter.js");
const ytsr = require("ytsr");
const { getPlaylistID } = require("ytpl");
const ytpl = require("ytpl");
const { notify } = require("../commands.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Воспроизвести в боте аудио')
        .addStringOption(o => o
            .setName('audio')
            .setDescription('Url или наименование видео записи с youtube')
            .setRequired(true))
        .addBooleanOption(o => o
            .setName('force')
            .setDescription('Добавить в начало очереди?')
            .setRequired(false)),
    async execute(interaction) {
        await add(interaction);
    },
    async listener(interaction) {}
}

const add = async (interaction) => {
    const audio = interaction.options.getString('audio');
    let info;

    try {
        getPlaylistID(audio).then(async a => {
            ytpl(a).then(async p => {
                p.items.forEach(i => {
                    info = {
                        title: i.title,
                        length: timeFormat(i.durationSec),
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
                    .setColor('#00ff00')
                    .setTitle(info.title)
                    .setURL(info.url)
                    .setDescription(`Количество композиций: ${info.length}`)
                    .setThumbnail(info.preview)
                    .setTimestamp()
                    .setFooter(`Плейлист предложил пользователь ${interaction.user.username}`);
                await notify('play', interaction, {embeds: [embed]});
                log(`[Play.Add] Плейлист успешно добавлен в очередь`);

                
                /** */
                if (!interaction.client.queue.connection) await join(interaction);
                if (interaction.client.queue.connection && !interaction.client.queue.player) {
                    interaction.client.queue.player = createAudioPlayer({
                        behaviors: {
                            noSubscriber: NoSubscriberBehavior.Stop
                        }
                    });
                    interaction.client.queue.connection.subscribe(interaction.client.queue.player);
                    interaction.client.queue.player.on('debug', console.log);
                    interaction.client.queue.player.on('error', console.error);
                    interaction.client.queue.player.on(AudioPlayerStatus.Idle, () => {
                        if (interaction.client.queue.songs.length === 0) {
                            return;
                        }
                        console.log(`[Event]: ${interaction.client.queue.songs[0].title}`);
                        interaction.client.queue.player.play(createAudioResource(ytdl(interaction.client.queue.songs.shift().url, { 
                            filter: 'audioonly', 
                            quality: 'highestaudio'
                        })));
                    })
                }
                if (interaction.client.queue.player.state.status !== AudioPlayerStatus.Playing) {
                    console.log(`[Inter]: ${interaction.client.queue.songs[0].title}`);
                    interaction.client.queue.player.play(createAudioResource(ytdl(interaction.client.queue.songs.shift().url, { 
                        filter: 'audioonly', 
                        quality: 'highestaudio'
                    })));
                }
                
                /** */
            }).catch(err => {throw err});
        }).catch(() => { 
            if (validateURL(audio)) {
                ytdl.getBasicInfo(audio).then(async i => {
                    info = {
                        title: i.videoDetails.title,
                        length: timeFormat(i.videoDetails.lengthSeconds),
                        url: i.videoDetails.video_url,
                        isLive: i.videoDetails.isLiveContent,
                        preview: i.videoDetails.thumbnails[0].url
                    };
                    interaction.client.queue.songs.push(info);
    
                    const embed = new MessageEmbed()
                        .setColor('#00ff00')
                        .setTitle(info.title)
                        .setURL(info.url)
                        .setDescription(`Длительность: ${info.isLive ? 
                            '<Стрим>' : info.length}`)
                        .setThumbnail(info.preview)
                        .setTimestamp()
                        .setFooter(`Композицию заказал пользователь ${interaction.user.username}`);
                    await notify('play', interaction, {embeds: [embed]});
                    log(`[Play.Add] Композиция успешно добавлена в очередь`);
                }).catch(err => {throw err})
            } else {
                ytsr(audio, {
                    gl: 'RU',
                    hl: 'ru',
                    limit: 1
                }).then(async r => {
                    ytdl.getBasicInfo(r.items[0].url).then(async i => {
                        info = {
                            title: i.videoDetails.title,
                            length: timeFormat(i.videoDetails.lengthSeconds),
                            url: i.videoDetails.video_url,
                            isLive: i.videoDetails.isLiveContent,
                            preview: i.videoDetails.thumbnails[0].url
                        };
                        interaction.client.queue.songs.push(info);
        
                        const embed = new MessageEmbed()
                            .setColor('#00ff00')
                            .setTitle(info.title)
                            .setDescription(`Длительность: ${info.isLive ? 
                                '<Стрим>' : info.length}`)
                            .setThumbnail(info.preview)
                            .setTimestamp()
                            .setFooter(`Композицию заказал пользователь ${interaction.user.username}`);
                        await notify('play', interaction, {embeds: [embed]});
                        log(`[Play.Add] Композиция успешно добавлена в очередь`);
                    }).catch(err => {throw err})
                }).catch(err => {throw err})
            }
        });
    } catch (e) {
        const embed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('Ошибка')
            .setTimestamp()
            .setDescription(e);
        await notify('play', interaction, {embeds: [embed]});
        log(`[Join]:\n${e}`);
        return;
    }
}

//https://www.youtube.com/watch?v=DNzvzacF7MM
const play = async (interaction) => {
    const audio = interaction.options.getString('audio');
    let info;

    try {
        //await StreamDownloader(audio).then(async data => {
            /*const data = await StreamDownloader(audio, {BypassRatelimit: true});
            info = {
                title: data.tracks[0].title,
                length: timeFormat(data.tracks[0].duration),
                url: data.tracks[0].url,
                stream: data.tracks[0].stream,  
                isLive: data.tracks[0].is_live,
                preview: data.tracks[0].thumbnail
            };
            interaction.client.queue.songs.push(info);*/

            const embed = new MessageEmbed()
                .setColor('#00ff00')
                //.setTitle(info.title)
                //.setURL(info.url)
                //.setDescription(`Длительность: ${info.isLive ? 
                //    '<Стрим>' : info.length}`)
                //.setThumbnail(info.preview)
                .setTimestamp()
                .setFooter(`Композицию заказал пользователь ${interaction.user.username}`);
            await notify('play', interaction, {embeds: [embed]});
            //await interaction.channel.send({embeds: [embed]});
            log(`[Play.Add] Композиция успешно добавлена в очередь`);      
            console.log(interaction.reply);
        //}).catch(err => {throw err});

        
        
        /*if(Data.error) throw error;
        
        let Audio_Resource = createAudioResource(Data.tracks[0].stream, {
            inputType: Data.tracks[0].stream_type
        });

        if (!interaction.client.queue.connection) await join(interaction);
        if (!interaction.client.queue.player) {
            interaction.client.queue.player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Stop
                }
            });
            interaction.client.queue.connection.subscribe(interaction.client.queue.player);
            interaction.client.queue.player.on('debug', console.log);
            interaction.client.queue.player.on('error', console.error);
            /*interaction.client.queue.player.on(AudioPlayerStatus.Idle, () => {
                interaction.client.queue.player.play(Audio_Resource);
            })*/
        /*}
        if (interaction.client.queue.player.state.status !== AudioPlayerStatus.Playing) {
            interaction.client.queue.player.play(Audio_Resource);
        }*/
    } catch (e) {
        const embed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('Ошибка')
            .setTimestamp()
            .setDescription(`${e}`);
        //await notify('play', interaction, {embeds: [embed]});
        log(e);
        return;
    }
}