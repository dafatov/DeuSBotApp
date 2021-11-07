const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { notify, notifyError } = require('../commands');
const { log } = require('../../utils/logger.js');

module.exports = {
    data: new SlashCommandBuilder().
        setName('ping').
        setDescription('Пинг и отпинг'),
    async execute(interaction) {
        await ping(interaction);
    },
    async listener(interaction) {}
}

const ping = async (interaction) => {
    const embed = new MessageEmbed()
        .setColor('#000000')
        .setTitle('Мое время обработки данных')
        .setTimestamp()
        .setDescription(`Решал на досуге задачи тысячелетия и решил за ${Math.round(interaction.client.ws.ping)}мс. Их все.`);

    try {
        await notify('ping', interaction, {embeds: [embed]});
        log(`[ping] Список реакций успешно обновлен`);
    } catch (e) {
        notifyError('ping', e, interaction);
    }
}