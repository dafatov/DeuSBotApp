const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

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
        .setTitle('Пинг')
        .setTimestamp()
        .setDescription(`Задержка равна ${Math.round(interaction.client.ws.ping)}мс`);

    try {
        await interaction.reply({embeds: [embed]})
        log(`[Response.Show] Список реакций успешно обновлен`);
    } catch (e) {
        error(`[Response.Show]:\n${e}`)
    }
}