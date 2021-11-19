const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");
const { escaping } = require("../../utils/string.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Зациклить/отциклить проигрывание композиции'),
    async execute(interaction) {
        await loop(interaction);
    },
    async listener(interaction) {}
}

const loop = async (interaction) => {
    if (!interaction.client.queue.connection || !interaction.client.queue.player) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Так ничего и не играло')
            .setDescription(`Как ты жалок... Зачем зацикливать, то чего нет? Или у тебя голоса в голове?`)
            .setTimestamp();
        await notify('loop', interaction, {embeds: [embed]});
        log(`[loop] Изменить состояние зацикленности не вышло: плеер не играет`);
        return;
    }

    if (interaction.client.queue.connection.joinConfig.channelId !==
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

    let isLoop = interaction.client.queue.nowPlaying.isLoop;
    interaction.client.queue.nowPlaying.isLoop = !isLoop;
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(`Проигрывание ${isLoop ? 'отциклено' : 'зациклено'}`)
        .setDescription(`${isLoop
            ? `しーん...`
            : `オラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラオラ...`}`);
    await notify('loop', interaction, {embeds: [embed]});
    log(`[loop] Композиция была успешна ${isLoop ? 'отциклена' : 'зациклена'}`);
}