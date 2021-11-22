const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { log } = require("../../utils/logger");
const { timeFormatSeconds, timeFormatmSeconds } = require("../../utils/converter.js");
const { notify, notifyError } = require("../commands");
const config = require("../../configs/config.js");
const progressBar = require('string-progressbar');
const { escaping } = require("../../utils/string.js");
const { createStatus } = require("../../utils/attachments");
const { pause } = require("./pause");
const { skip } = require("./skip");
const { loop } = require("./loop");
const { getQueue } = require("../player");

let {start, count} = {start: 0, count: 5};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Отображение очереди композиций на воспроизведение'),
    async execute(interaction) {
        await queue(interaction);
    },
    async listener(interaction) {
        await onQueue(interaction);
    }
}

const queue = async (interaction) => {
    const songs = getQueue(interaction.guildId).songs;

    if (songs.length === 0 && !getQueue(interaction.guildId).nowPlaying.song) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Мир музыки пуст')
            .setDescription(`Может ли существовать мир без музыки? Каким бы он был...
                Ах да! Таким, в котором сейчас живешь ты~~`)
            .setTimestamp();
        await notify('queue', interaction, {embeds: [embed]});
        log(`[queue] Вывести очередь не вышло: плеер не играет и очередь пуста`);
        return;
    }

    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setFooter(`${Math.min(start + 1, songs.length)} - ${Math.min(start + count, songs.length)} из ${songs.length} по ${count}`);

    embed.setFields(songs
        .slice(start, count)
        .map((song, i) => ({
            name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${escaping(song.title)}`,
            value: `${song.isLive ? '<Стрим>' : timeFormatSeconds(song.length)}`
        })));

    const barString = progressBar.filledBar(getQueue(interaction.guildId).nowPlaying.song.length * 1000, getQueue(interaction.guildId).nowPlaying.resource.playbackDuration);
    embed.setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
        .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
        .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
        .setDescription(`${getQueue(interaction.guildId).nowPlaying.song.isLive
                ? '<Стрим>' 
                : `${timeFormatmSeconds(getQueue(interaction.guildId).nowPlaying.resource.playbackDuration)}/${timeFormatSeconds(getQueue(interaction.guildId).nowPlaying.song.length)}`}
            ${getQueue(interaction.guildId).nowPlaying.song.isLive
                ? '\u200B\n'
                : `${barString[0]} [${Math.round(barString[1])}%]\n`}`);

    const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('first')
            .setLabel('|<')
            .setStyle('PRIMARY')
            .setDisabled(start <= 0),
        new MessageButton()
            .setCustomId('previous')
            .setLabel('<')
            .setStyle('PRIMARY')
            .setDisabled(start <= 0),
        new MessageButton()
            .setCustomId('update')
            .setLabel('Обновить')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('next')
            .setLabel('>')
            .setStyle('PRIMARY')
            .setDisabled(start + count >= songs.length),
        new MessageButton()
            .setCustomId('last')
            .setLabel('>|')
            .setStyle('PRIMARY')
            .setDisabled(start + count >= songs.length),
    );

    const control = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('pause')
            .setLabel(getQueue(interaction.guildId).nowPlaying?.isPause ? 'Возобновить' : 'Приостановить')
            .setStyle(getQueue(interaction.guildId).nowPlaying?.isPause ? 'SUCCESS' : 'DANGER'),
        new MessageButton()
            .setCustomId('skip')
            .setLabel('Пропустить')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('loop')
            .setLabel(getQueue(interaction.guildId).nowPlaying?.isLoop ? 'Отциклить' : 'Зациклить')
            .setStyle(getQueue(interaction.guildId).nowPlaying?.isLoop ? 'DANGER' : 'SUCCESS'),
    );

    const status = await createStatus(getQueue(interaction.guildId).nowPlaying);
    try {
        await notify('queue', interaction, {files: [status], embeds: [embed], components: [row, control]});
        log(`[queue] Список композиций успешно выведен`);
    } catch (e) {
        notifyError('queue', e, interaction);
    }
};

const onQueue = async (interaction) => {
    const songs = getQueue(interaction.guildId).songs;

    let embed = interaction.message.embeds[0];
    let row = interaction.message.components[0];
    let control = interaction.message.components[1];
    let {start, count} = calcPages(embed.footer.text);

    if (interaction.customId === 'next') start += count;
    if (interaction.customId === 'previous') start -= count;
    if (interaction.customId === 'update') start = Math.min(start, songs.length - 1);
    if (interaction.customId === 'first') start = 0;
    if (interaction.customId === 'last') start = count * Math.floor(songs.length / count);

    if (interaction.customId === 'pause') await pause(interaction);
    if (interaction.customId === 'skip') await skip(interaction);
    if (interaction.customId === 'loop') await loop(interaction);

    if (songs.length === 0 && !getQueue(interaction.guildId).nowPlaying.song) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Мир музыки пуст')
            .setDescription(`Может ли существовать мир без музыки? Каким бы он был...
                Ах да! Таким, в котором сейчас живешь ты~~`)
            .setTimestamp();
        await interaction.message.delete();
        await notify('queue', interaction, {embeds: [embed]});
        log(`[queue] Вывести очередь не вышло: плеер не играет и очередь пуста`);
        return;
    }
    
    row.components.forEach(b => {
        if (b.customId === 'next') {
            b.setDisabled(start + count >= songs.length);
        }
        if (b.customId === 'previous') {
            b.setDisabled(start <= 0);
        }
        if (b.customId === 'first') {
            b.setDisabled(start <= 0);
        }
        if (b.customId === 'last') {
            b.setDisabled(start + count >= songs.length);
        }
    });
    control.components.forEach(b => {
        if (b.customId === 'pause') {
            b.setLabel(getQueue(interaction.guildId).nowPlaying?.isPause ? 'Возобновить' : 'Приостановить');
            b.setStyle(getQueue(interaction.guildId).nowPlaying?.isPause ? 'SUCCESS' : 'DANGER');
        }
        if (b.customId === 'skip') {
        }
        if (b.customId === 'loop') {
            b.setLabel(getQueue(interaction.guildId).nowPlaying?.isLoop ? 'Отциклить' : 'Зациклить');
            b.setStyle(getQueue(interaction.guildId).nowPlaying?.isLoop ? 'DANGER' : 'SUCCESS');
        }
    });

    const barString = progressBar.filledBar(getQueue(interaction.guildId).nowPlaying.song.length * 1000, getQueue(interaction.guildId).nowPlaying.resource.playbackDuration);
    embed.setTitle(escaping(getQueue(interaction.guildId).nowPlaying.song.title))
        .setURL(getQueue(interaction.guildId).nowPlaying.song.url)
        .setThumbnail(getQueue(interaction.guildId).nowPlaying.song.preview)
        .setDescription(`${getQueue(interaction.guildId).nowPlaying.song.isLive
                ? '<Стрим>' 
                : `${timeFormatmSeconds(getQueue(interaction.guildId).nowPlaying.resource.playbackDuration)}/${timeFormatSeconds(getQueue(interaction.guildId).nowPlaying.song.length)}`}
            ${getQueue(interaction.guildId).nowPlaying.song.isLive
                ? '\u200B\n'
                : `${barString[0]} [${Math.round(barString[1])}%]\n`}`)
        .setFields(songs
            .slice(start, start + count)
            .map((song, i) => ({
                name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${escaping(song.title)}`,
                value: `${song.isLive ? '<Стрим>' : timeFormatSeconds(song.length)}`
            })))
            //Данные количества на странице (count) беруться из footer'а. Да, костыль
        .setFooter(`${start + 1} - ${Math.min(start + count, songs.length)} из ${songs.length} по ${count}`);
    
    const status = await createStatus(getQueue(interaction.guildId).nowPlaying);
    try {
        await interaction.message.removeAttachments();
        await interaction.update({files: [status], embeds: [embed], components: [row, control]});
    } catch (e) {
        notifyError('queue', e, interaction);
        error(e);
    }
}

function calcPages(footer) {
    let array = footer.split(' ');
    return {start: Math.max(array[0], 1) - 1, count: parseInt(array[6])};
}