const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { logGuild } = require("../../utils/logger");
const { notify } = require("../commands");
const config = require("../../configs/config.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Детальное описание тонкостей работы некоторых команд')
        .addStringOption(s => s
            .setName('command')
            .setDescription('Наименование комманды')
            .setRequired(false)
            .addChoice('response add', 'response add')
            .addChoice('response remove', 'response remove')),
    async execute(interaction) {
        await help(interaction);
    },
    async listener(interaction) {}
}

const help = async (interaction) => {
    let command = interaction.options.getString("command") || 'боту Deus';
    let help;

    switch (command) {
        case 'response add':
            help = `Для описания триггера реакции используется система реугярных выражений. Идея данной системы состоит в создании шаблона, определяющего правило поиска в строке. Базовая информация доступна на сайте <http://website-lab.ru/article/regexp/shpargalka_po_regulyarnyim_vyirajeniyam/>. Хороший сайт для тестирования регулярных выражений: <https://regexr.com/>
                
                **Для ленивых**: При отсутствии специальных символов регулярных выражений **^ $ ( ) < [ ] * . \\ - + | ? { }** шаблон аналогичен таковому у бота Dyno (на 2021.11.14). При необходимости использования данных символов нужно импользовать экранирование символом **\\**`;
            break;
        case 'response remove':
            help = `Для удаления сущесвующей реакции необходимо ввести триггер в команду удаления. Наиболее удобным способом является: Открыть командой **response show** все реакции -> Найти необходимую -> Скопировать триггер -> Вставить в команду удаления.`;
            break;
        default:
            help = `Данный бот (Deus) был разработан DemetriouS (aka dafatov) в рамках частного проекта специально для данного сервера на чистом энузиазме, а, следовательно, все претензии, требования, жалобы и другие проявления человеческого социального одностроннего взаимодействия могут идти лесом, рощей и т.п.

                Для остальных - при нахождении бага, просьба точно определиться, что это баг, а не фича, для начала. Перейти на сайт <https://github.com/dafatov/DeusBot/issues> и оставить там **New issue**, в котором **описать ситуациию возникновения проблемы, ожидаемый результат и полученный результат**.`;
            break;
    }

    const embed = new MessageEmbed()
        .setColor(config.colors.info)
        .setTitle(`Информация по **${command}**`)
        .setDescription(help)
        .setFooter('Copyright (c) 2021 dafatov', 'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png');
    await notify('help', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[help]: Помощь по \"${command}\" выведена успешно`);
}