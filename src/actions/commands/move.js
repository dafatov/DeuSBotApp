const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { log } = require("../../utils/logger");
const { notify } = require("../commands");

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
        await move(interaction);
    },
    async listener(interaction) {}
}

const move = async (interaction) => {
    if (!interaction.client.queue.songs || interaction.client.queue.songs.length <= 2) {
        const embed = new MessageEmbed()
            .setColor('#ffff00')
            .setTitle('Ты одинок что ли? Соло-игрок?')
            .setDescription(`${interaction.client.queue.songs.length === 0
                ? 'Пытаться перемещать то, чего нет, показывает все твое отчаяние. **Пуст плейлист. Пуст.**'
                : 'В одиночку, конечно, можно получить удовольствие, но двигать то все равно не куда. **Одна песня в плейлисте. Как ты...**'}`)
            .setTimestamp();
        await notify('move', interaction, {embeds: [embed]});
        log(`[move] Пропустить композицию не вышло: плеер не играет`);
        return;
    }

    if (interaction.client.queue.connection.joinConfig.channelId !==
        interaction.member.voice.channel.id) {
            const embed = new MessageEmbed()
                .setColor('#ffff00')
                .setTitle('Канал не тот')
                .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
                .setTimestamp();
            await notify('move', interaction, {embeds: [embed]});
            log(`[move] Пропустить композицию не вышло: не совпадают каналы`);
            return;
    }

    let targetIndex = interaction.options.getInteger("target") - 1;
    let positionIndex = interaction.options.getInteger("position") - 1;
    let target = interaction.client.queue.songs[targetIndex].title;

    arrayMoveMutable(interaction.client.queue.songs, targetIndex, positionIndex);
    const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle('Целевая композиция передвинута')
        .setDescription(`Композиция **${target}** протолкала всех локтями на **${positionIndex + 1}**.
            Кто бы сомневался. Донатеры \*\*\*ые`);
    await notify('move', interaction, {embeds: [embed]});
    log(`[move] Композиция была успешно пропущено`);
}

const arrayMoveMutable = (array, fromIndex, toIndex) => {
	const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

	if (startIndex >= 0 && startIndex < array.length) {
		const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

		const [item] = array.splice(fromIndex, 1);
		array.splice(endIndex, 0, item);
	}
}