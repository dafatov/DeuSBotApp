const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify, notifyError } = require("../commands");

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

    const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle('Все композиции на данный момент')
        .setFooter(`${Math.min(start + 1, songs.length)} - ${Math.min(start + count, songs.length)} из ${songs.length} по ${count}`);
    
    embed.setFields(songs
        .slice(start, count)
        .map((song, i) => ({
            name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${song.title}`,
            value: `${song.isLive ? '<Стрим>' : song.length}`
        })));

    const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle('PRIMARY')
            .setDisabled(start <= 0),
        new MessageButton()
            .setCustomId('update')
            .setLabel('Update')
            .setStyle('PRIMARY')
            .setDisabled(songs.length === 0),
        new MessageButton()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle('PRIMARY')
            .setDisabled(start + count >= songs.length),
    );

    try {
        await notify('queue', interaction, {embeds: [embed], components: [row]});
        log(`[queue] Список композиций успешно выведен`);
    } catch (e) {
        notifyError('queue', e, interaction);
    }
};

const onQueue = async (interaction) => {
    const songs = interaction.client.queue.songs;

    let embed = interaction.message.embeds[0];
    let row = interaction.message.components[0];
    let {start, count} = calcPages(embed.footer.text);

    if (interaction.customId === 'next') start += count;
    if (interaction.customId === 'previous') start -= count;
    if (interaction.customId === 'update') start = Math.min(start, songs.length - 1);
    
    row.components.forEach(b => {
        if (b.customId === 'next') {
            b.setDisabled(start + count >= songs.length);
        }
        if (b.customId === 'previous') {
            b.setDisabled(start <= 0);
        }
        if (b.customId === 'update') {
            b.setDisabled(songs.length === 0);
        }
    })

    embed.setFields(songs
        .slice(start, start + count)
        .map((song, i) => ({
            name: `${String(start + i + 1).padStart(String(songs.length).length, '0')}). ${song.title}`,
            value: `${song.isLive ? '<Стрим>' : song.length}`
        })))
        //Данные количества на странице (count) беруться из footer'а. Да, костыль
    .setFooter(`${start + 1} - ${Math.min(start + count, songs.length)} из ${songs.length} по ${count}`);

    try {
        await interaction.update({embeds: [embed], components: [row]});
        log(`[queue.update] Список композиций успешно обновлен`);
    } catch (e) {
        notifyError('queue.update', e, interaction);
    }
}

function calcPages(footer) {
    let array = footer.split(' ');
    return {start: array[0] - 1, count: parseInt(array[6])};
}