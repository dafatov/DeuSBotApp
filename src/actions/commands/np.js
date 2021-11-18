const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");
const { timeFormatSeconds, timeFormatmSeconds } = require("../../utils/converter");
const progressBar = require('string-progressbar');
const { escaping } = require("../../utils/string.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('np')
        .setDescription('Отобразить текущую композицию'),
    async execute(interaction) {
        await np(interaction);
    },
    async listener(interaction) {}
}

const np = async (interaction) => {
    let info = interaction.client.queue.nowPlaying;

    if (!interaction.client.queue.connection || !interaction.client.queue.player || !info.song) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Так ничего и не играло')
            .setDescription(`Как ты жалок... Это же уже было когда ты пытался пропустить, верно?~
                Теперь ты повторяешь это в при получении текущей композиции. Или это было в другом порядке?`)
            .setTimestamp();
        await notify('np', interaction, {embeds: [embed]});
        log(`[np] Пропустить композицию не вышло: плеер не играет`);
        return;
    }

    if (interaction.client.queue.connection.joinConfig.channelId !==
        interaction.member.voice.channel.id) {
            const embed = new MessageEmbed()
                .setColor(config.colors.warning)
                .setTitle('Канал не тот')
                .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь...
                    Дежавю? Разве этого же не было в пропуске композиции? Или у этого времени другой порядок...`)
                .setTimestamp();
            await notify('np', interaction, {embeds: [embed]});
            log(`[np] Пропустить композицию не вышло: не совпадают каналы`);
            return;
    }

    const barString = progressBar.filledBar(info.song.length * 1000, info.resource.playbackDuration);
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(escaping(info.song.title))
        .setURL(info.song.url)
        .addField(`${info.song.isLive
                ? '<Стрим>' 
                : `${timeFormatmSeconds(info.resource.playbackDuration)}/${timeFormatSeconds(info.song.length)}`}`,
            `${info.song.isLive
                ? '\u200B'
                : `${barString[0]} [${Math.round(barString[1])}%]`}`)
        .setThumbnail(info.song.preview)
        .setTimestamp()
        .setFooter(`Композицию заказал пользователь ${interaction.user.username}`);
    await notify('np', interaction, {embeds: [embed]});
    log(`[np] Успешно выведана текущая композиция`);
}