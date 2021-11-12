const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");

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

    if (!interaction.client.queue.connection || !interaction.client.queue.player || !info) {
        const embed = new MessageEmbed()
            .setColor('#ffff00')
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
                .setColor('#ffff00')
                .setTitle('Канал не тот')
                .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь...
                    Дежавю? Разве этого же не было в пропуске композиции? Или у этого времени другой порядок...`)
                .setTimestamp();
            await notify('np', interaction, {embeds: [embed]});
            log(`[np] Пропустить композицию не вышло: не совпадают каналы`);
            return;
    }

    const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle(info.title)
        .setURL(info.url)
        .setDescription(`Длительность: ${info.isLive ? 
            '<Стрим>' : info.length}`)
        .setThumbnail(info.preview)
        .setTimestamp()
        .setFooter(`Композицию заказал пользователь ${interaction.user.username}`);
    await notify('np', interaction, {embeds: [embed]});
    log(`[np] Успешно выведана текущая композиция`);
}