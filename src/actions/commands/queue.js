const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { log } = require("../../utils/logger");
const { timeFormatSeconds, timeFormatmSeconds } = require("../../utils/converter.js");
const { notify, notifyError } = require("../commands");
const config = require("../../configs/config.js");
const progressBar = require('string-progressbar');
const { escaping } = require("../../utils/string.js");
const { createStatus } = require("../../utils/attachments");

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
    const songs = interaction.client.queue.songs;

    if (songs.length === 0 && !interaction.client.queue.nowPlaying.song) {
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

    const barString = progressBar.filledBar(interaction.client.queue.nowPlaying.song.length * 1000, interaction.client.queue.nowPlaying.resource.playbackDuration);
    embed.setTitle(escaping(interaction.client.queue.nowPlaying.song.title))
        .setURL(interaction.client.queue.nowPlaying.song.url)
        .setThumbnail(interaction.client.queue.nowPlaying.song.preview)
        .setDescription(`${interaction.client.queue.nowPlaying.song.isLive
                ? '<Стрим>' 
                : `${timeFormatmSeconds(interaction.client.queue.nowPlaying.resource.playbackDuration)}/${timeFormatSeconds(interaction.client.queue.nowPlaying.song.length)}`}
            ${interaction.client.queue.nowPlaying.song.isLive
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

    const status = await createStatus(interaction.client.queue.nowPlaying);
    try {
        await notify('queue', interaction, {files: [status], embeds: [embed], components: [row]});
        log(`[queue] Список композиций успешно выведен`);
    } catch (e) {
        notifyError('queue', e, interaction);
        error(e);
    }
};

const onQueue = async (interaction) => {
    const songs = interaction.client.queue.songs;

    if (songs.length === 0 && !interaction.client.queue.nowPlaying.song) {
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

    let embed = interaction.message.embeds[0];
    let row = interaction.message.components[0];
    let {start, count} = calcPages(embed.footer.text);

    if (interaction.customId === 'next') start += count;
    if (interaction.customId === 'previous') start -= count;
    if (interaction.customId === 'update') start = Math.min(start, songs.length - 1);
    if (interaction.customId === 'first') start = 0;
    if (interaction.customId === 'last') start = count * Math.floor(songs.length / count);
    
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
    })

    const barString = progressBar.filledBar(interaction.client.queue.nowPlaying.song.length * 1000, interaction.client.queue.nowPlaying.resource.playbackDuration);
    embed.setTitle(escaping(interaction.client.queue.nowPlaying.song.title))
        .setURL(interaction.client.queue.nowPlaying.song.url)
        .setThumbnail(interaction.client.queue.nowPlaying.song.preview)
        .setDescription(`${interaction.client.queue.nowPlaying.song.isLive
                ? '<Стрим>' 
                : `${timeFormatmSeconds(interaction.client.queue.nowPlaying.resource.playbackDuration)}/${timeFormatSeconds(interaction.client.queue.nowPlaying.song.length)}`}
            ${interaction.client.queue.nowPlaying.song.isLive
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
    
    const status = await createStatus(interaction.client.queue.nowPlaying);
    try {
        await interaction.message.removeAttachments();
        await interaction.update({files: [status], embeds: [embed], components: [row]});
    } catch (e) {
        notifyError('queue', e, interaction);
        error(e);
    }
}

function calcPages(footer) {
    let array = footer.split(' ');
    return {start: Math.max(array[0], 1) - 1, count: parseInt(array[6])};
}