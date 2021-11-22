const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");
const { escaping } = require("../../utils/string");
const { arrayMoveMutable } = require("../../utils/array.js");
const { getQueue } = require("../player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Переместить композицию с места в очереди на другое')
        .addIntegerOption(o => o
            .setName('target')
            .setDescription('Номер в очереди целевой композиции')
            .setRequired(true))
        .addIntegerOption(o => o
            .setName('position')
            .setDescription('Номер конечной позиции целевой композиции')
            .setRequired(true)),
    async execute(interaction) {
        await module.exports.move(interaction, interaction.options.getInteger("position") - 1);
    },
    async listener(interaction) {}
}

module.exports.move = async (interaction, positionIndex) => {
    if (!getQueue(interaction.guildId).songs || getQueue(interaction.guildId).songs.length < 2) {
        const embed = new MessageEmbed()
            .setColor(config.colors.warning)
            .setTitle('Ты одинок что ли? Соло-игрок?')
            .setDescription(`${getQueue(interaction.guildId).songs.length === 0
                ? 'Пытаться перемещать то, чего нет, показывает все твое отчаяние. **Пуст плейлист. Пуст.**'
                : 'В одиночку, конечно, можно получить удовольствие, но двигать то все равно не куда. **Одна песня в плейлисте. Как ты...**'}`)
            .setTimestamp();
        await notify('move', interaction, {embeds: [embed]});
        log(`[move] Переместить композицию не вышло: плеер не играет`);
        return;
    }

    if (getQueue(interaction.guildId).connection.joinConfig.channelId !==
        interaction.member.voice.channel.id) {
            const embed = new MessageEmbed()
                .setColor(config.colors.warning)
                .setTitle('Канал не тот')
                .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
                .setTimestamp();
            await notify('move', interaction, {embeds: [embed]});
            log(`[move] Переместить композицию не вышло: не совпадают каналы`);
            return;
    }

    let targetIndex = interaction.options.getInteger("target") - 1;
    let targetTitle = escaping(getQueue(interaction.guildId).songs[targetIndex].title);

    if (targetIndex < 0 || targetIndex + 1 > getQueue(interaction.guildId).songs.length
        || positionIndex < 0 || positionIndex + 1 > getQueue(interaction.guildId).songs.length) {
            const embed = new MessageEmbed()
                .setColor(config.colors.warning)
                .setTitle('Ты это.. Вселенной ошибся, чел.')
                .setDescription(`Типа знаешь вселенная расширяется, а твой мозг походу нет. Ну вышел ты за пределы размеров очереди.
                    Диапазон значений _от 1 до ${getQueue(interaction.guildId).songs.length}_`)
                .setTimestamp();
            await notify('move', interaction, {embeds: [embed]});
            log(`[move] Переместить композицию не вышло: выход за пределы очереди`);
            return;
    }

    arrayMoveMutable(getQueue(interaction.guildId).songs, targetIndex, positionIndex);
    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle('Целевая композиция передвинута')
        .setDescription(`Композиция **${targetTitle}** протолкала всех локтями на позицию **${positionIndex + 1}**.
            Кто бы сомневался. Донатеры ${escaping('****')}ые`);
    await notify('move', interaction, {embeds: [embed]});
    log(`[move] Композиция была успешна перемещена`);
}