const { SlashCommandBuilder } = require("@discordjs/builders");
const { shuffleArray } = require("../../utils/array");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Перемешать очередь'),
    async execute(interaction) {
        await shuffle(interaction);
    },
    async listener(interaction) {}
}

const shuffle = async (interaction) => {
    if (!interaction.client.queue.connection || !interaction.client.queue.player) {
        const embed = new MessageEmbed()
            .setColor('#ffff00')
            .setTitle('Так ничего и не играло')
            .setDescription(`Как ты жалок... Зачем пропускать, то чего нет? Или у тебя голоса в голове?`)
            .setTimestamp();
        await notify('shuffle', interaction, {embeds: [embed]});
        log(`[shuffle] Пропустить композицию не вышло: плеер не играет`);
        return;
    }

    if (interaction.client.queue.connection.joinConfig.channelId !==
        interaction.member.voice.channel.id) {
            const embed = new MessageEmbed()
                .setColor('#ffff00')
                .setTitle('Канал не тот')
                .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
                .setTimestamp();
            await notify('shuffle', interaction, {embeds: [embed]});
            log(`[shuffle] Пропустить композицию не вышло: не совпадают каналы`);
            return;
    }

    shuffleArray(interaction.client.queue.songs);
    const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle('Плейлист ~~взболтан~~ перемешан')
        .setDescription(`Это было суровое время.. Мы мешали песни как могли, чтобы хоть как-то разнообразить свою серую жизнь..
            И  пришел он!! Генератор Псевдо Случайных Чисел или _ГПСЧ_! Он спас нас, но остался в безизвестности.. Так давайте восславим его.
            Присоединяйтесь к _культу ГПСЧ_!!! Да пребудет с Вами **Бог Псевдо Рандома**`);
    await notify('shuffle', interaction, {embeds: [embed]});
    log(`[shuffle] Плейлист успешно перемешан`);
}

