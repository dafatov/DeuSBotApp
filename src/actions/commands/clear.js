const { SlashCommandBuilder } = require("@discordjs/builders");
const { shuffleArray } = require("../../utils/array");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");

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
    if (!interaction.client.queue.connection || !interaction.client.queue.player
        || interaction.client.queue.songs.length == 0) {
        const embed = new MessageEmbed()
            .setColor('#ffff00')
            .setTitle('Так ничего и не играло')
            .setDescription(`Как ты жалок... Зачем очищать, то чего нет? Или у тебя голоса в голове?`)
            .setTimestamp();
        await notify('clear', interaction, {embeds: [embed]});
        log(`[clear] Очистить очередь не вышло: плеер не играет`);
        return;
    }

    if (interaction.client.queue.connection.joinConfig.channelId !==
        interaction.member.voice.channel.id) {
            const embed = new MessageEmbed()
                .setColor('#ffff00')
                .setTitle('Канал не тот')
                .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
                .setTimestamp();
            await notify('clear', interaction, {embeds: [embed]});
            log(`[clear] Очистить очередь не вышло: не совпадают каналы`);
            return;
    }

    interaction.client.queue.songs = [];
    const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle('Э-эм. а где все?')
        .setDescription(`Ох.. Эти времена, эти нравы.. Кто-то созидает, а кто-то может только уничтожать.
            Поздравляю разрушитель, у тебя получилось. **Плейлист очищен**`);
    await notify('clear', interaction, {embeds: [embed]});
    log(`[clear] Плейлист успешно очищен`);
}

