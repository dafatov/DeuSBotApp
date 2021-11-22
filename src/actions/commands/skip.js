const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");
const { escaping } = require("../../utils/string.js");
const player = require("../player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Пропустить текущую композицию'),
    async execute(interaction) {
        await module.exports.skip(interaction, true);
    },
    async listener(interaction) {}
}

module.exports.skip = async (interaction, isExecute) => {
    if (!player.getQueue(interaction.guildId).connection || !player.getQueue(interaction.guildId).player) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Так ничего и не играло')
            .setDescription(`Как ты жалок... Зачем пропускать, то чего нет? Или у тебя голоса в голове?`)
            .setTimestamp();
        await notify('skip', interaction, {embeds: [embed]});
        log(`[skip] Пропустить композицию не вышло: плеер не играет`);
        return;
    }

    if (player.getQueue(interaction.guildId).connection.joinConfig.channelId !==
        interaction.member.voice.channel.id) {
            const embed = new MessageEmbed()
                .setColor(config.colors.warning)
                .setTitle('Канал не тот')
                .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
                .setTimestamp();
            await notify('skip', interaction, {embeds: [embed]});
            log(`[skip] Пропустить композицию не вышло: не совпадают каналы`);
            return;
    }
    
    let skipped = await player.skip(interaction.guildId);
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle('Текущая композиция уничтожена')
        .setDescription(`Название того, что играло уже не помню. Прошлое должно остаться в прошлом.
        ...Вроде это **${escaping(skipped.title)}**, но уже какая разница?`);
    if (isExecute) await notify('skip', interaction, {embeds: [embed]});
    log(`[skip] Композиция была успешно пропущена`);
}