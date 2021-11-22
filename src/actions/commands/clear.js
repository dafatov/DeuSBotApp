const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { logGuild } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");
const { getQueue, clearQueue } = require("../player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Очистить очередь'),
    async execute(interaction) {
        await shuffle(interaction);
    },
    async listener(interaction) {}
}

const shuffle = async (interaction) => {
    if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player
        || getQueue(interaction.guildId).songs.length == 0) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Так ничего и не играло')
            .setDescription(`Как ты жалок... Зачем очищать, то чего нет? Или у тебя голоса в голове?`)
            .setTimestamp();
        await notify('clear', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[clear]: Очистить очередь не вышло: плеер не играет`);
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
        await notify('clear', interaction, {embeds: [embed]});
        logGuild(interaction.guildId, `[clear]: Очистить очередь не вышло: не совпадают каналы`);
        return;
    }

    clearQueue(interaction.guildId);
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle('Э-эм. а где все?')
        .setDescription(`Ох.. Эти времена, эти нравы.. Кто-то созидает, а кто-то может только уничтожать.
            Поздравляю разрушитель, у тебя получилось. **Плейлист очищен**`);
    await notify('clear', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[clear]: Плейлист успешно очищен`);
}

