const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { logGuild } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");
const helps = require("../../configs/helpDoc.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Детальное описание тонкостей работы некоторых команд')
        .addStringOption(s => s
            .setName('command')
            .setDescription('Наименование комманды')
            .setRequired(false)
            .addChoices([...helps.keys()].map(k => [k, k]))),
    async execute(interaction) {
        await help(interaction);
    },
    async listener(interaction) {}
}

const help = async (interaction) => {
    let command = interaction.options.getString("command");
    let helpDefault = `Данный бот (Deus ${config.version}) был разработан DemetriouS (aka dafatov) в рамках частного проекта специально для данного сервера на чистом энузиазме, а, следовательно, все претензии, требования, жалобы и другие проявления человеческого социального одностроннего взаимодействия могут идти лесом, рощей и т.п.
    
        Для остальных - при нахождении бага, просьба точно определиться, что это баг, а не фича, для начала. Перейти на сайт <https://github.com/dafatov/DeusBot/issues> и оставить там **New issue**, в котором **описать ситуациию возникновения проблемы, ожидаемый результат и полученный результат**.`;

    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(`Информация по **${command ?? 'боту Deus'}**`)
        .setDescription(helps.get(command) ?? helpDefault)
        .setFooter('Copyright (c) 2021 dafatov', 'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png');
    await notify('help', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[help]: Помощь по \"${command}\" выведена успешно`);
}