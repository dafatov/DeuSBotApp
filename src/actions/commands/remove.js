const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { logGuild } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");
const { escaping } = require("../../utils/string.js");
const { getQueue } = require("../player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Удаляет композицию из очереди')
        .addIntegerOption(o => o
            .setName('target')
            .setDescription('Номер в очереди целевой композиции')
            .setRequired(true)),
    async execute(interaction) {
        await remove(interaction);
    },
    async listener(interaction) {}
}

const remove = async (interaction) => {
    if (!getQueue(interaction.guildId).songs || getQueue(interaction.guildId).songs.length < 1) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Ты одинок что ли? Соло-игрок?')
            .setDescription('Пытаться удалить то, чего нет, показывает все твое отчаяние. **Пуст плейлист. Пуст.**')
            .setTimestamp();
        await notify('remove', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[remove]: Удалить композицию не вышло: плеер не играет`);
        return;
    }

    if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
        && getQueue(interaction.guildId).connection.joinConfig.channelId !==
            interaction.member.voice.channel.id) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Канал не тот')
            .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
            .setTimestamp();
        await notify('remove', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[remove]: Удалить композицию не вышло: не совпадают каналы`);
        return;
    }

    let targetIndex = interaction.options.getInteger("target") - 1;

    if (targetIndex < 1 || targetIndex + 1 > getQueue(interaction.guildId).songs.length) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Ты это.. Вселенной ошибся, чел.')
            .setDescription(`Типа знаешь вселенная расширяется, а твой мозг походу нет. Ну вышел ты за пределы размеров очереди.`)
            .setTimestamp();
        await notify('remove', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[remove]: Удалить композицию не вышло: выход за пределы очереди`);
        return;
    }

    let target = getQueue(interaction.guildId).songs[targetIndex];

    getQueue(interaction.guildId).songs.splice(interaction.options.getInteger('target') - 1, 1);
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle('Целевая композиция дезинтегрирована')
        .setDescription(`Композиция **${escaping(target.title)}** была стерта из реальности очереди.`);
    await notify('remove', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[remove]: Композиция была успешно удалена из очереди`);
} 