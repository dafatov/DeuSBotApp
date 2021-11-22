const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");
const { escaping } = require("../../utils/string.js");
const { getQueue } = require("../player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Зациклить/отциклить проигрывание композиции'),
    async execute(interaction) {
        await module.exports.loop(interaction, true);
    },
    async listener(interaction) {}
}

module.exports.loop = async (interaction, isExecute) => {
    if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Так ничего и не играло')
            .setDescription(`Как ты жалок... Зачем зацикливать, то чего нет? Или у тебя голоса в голове?`)
            .setTimestamp();
        await notify('loop', interaction, {embeds: [embed]});
        log(`[loop] Изменить состояние зацикленности не вышло: плеер не играет`);
        return;
    }

    if (getQueue(interaction.guildId).connection.joinConfig.channelId !==
        interaction.member.voice.channel.id) {
            const embed = new MessageEmbed()
                .setColor(config.colors.warning)
                .setTitle('Канал не тот')
                .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
                .setTimestamp();
            await notify('loop', interaction, {embeds: [embed]});
            log(`[loop] Изменить состояние зацикленности не вышло: не совпадают каналы`);
            return;
    }

    let isLoop = getQueue(interaction.guildId).nowPlaying.isLoop;
    getQueue(interaction.guildId).nowPlaying.isLoop = !isLoop;
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(`Проигрывание ${isLoop ? 'отциклено' : 'зациклено'}`)
        .setDescription(`${isLoop
            ? `しーん...`
            : `オラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラ...`}`);
    if (isExecute) await notify('loop', interaction, {embeds: [embed]});
    log(`[loop] Композиция была успешна ${isLoop ? 'отциклена' : 'зациклена'}`);
}