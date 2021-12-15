const {SlashCommandBuilder} = require("@discordjs/builders");
const {Octokit} = require("@octokit/core");
const config = require("../../configs/config");
const {MessageEmbed} = require("discord.js");
const {notifyError, notify} = require("../commands");
const {logGuild} = require("../../utils/logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Манипулирование пожеланиями')
        .addStringOption(o => o
            .setName('type')
            .setDescription('Тип предложения')
            .setRequired(true)
            .addChoice('Ошибка', 'bug')
            .addChoice('Улучшение', 'enhancement')
            .addChoice('Документация', 'documentation'))
        .addStringOption(o => o
            .setName('title')
            .setDescription('Заголовок предложения')
            .setRequired(true))
        .addStringOption(o => o
            .setName('details')
            .setDescription('Подробное описание предложения. Для ошибок в формате: как вышло, что ожидалось, что вышло')
            .setRequired(true)),
    async execute(interaction) {
        await issue(interaction);
    },
    async listener(interaction) {}
}

const issue = async (interaction) => {
    const octokit = new Octokit({auth: config.githubToken});
    const data = {
        type: interaction.options.getString('type'),
        title: interaction.options.getString('title'),
        details: interaction.options.getString('details')
    };

    try {
        octokit.request('POST /repos/{owner}/{repo}/issues', {
            owner: config.githubLogin,
            repo: config.githubRepository,
            title: data.title,
            body: data.details,
            labels: [`<@${interaction.user.id}>`, data.type, 'discord-auto']
        }).then(async response => {
            if (response.status === 201) {
                const embed = new MessageEmbed()
                    .setColor(config.colors.info)
                    .setTitle(`Заявка \"${data.title}\" создана`)
                    .setDescription(data.details)
                    .setURL(response.data.html_url)
                    .setTimestamp();
                await notify('issue', interaction, {embeds: [embed]});
                logGuild(interaction.guildId, '[issue]: Заявка на github успешно создана');
            } else {
                throw "Unknown result without catch"
            }
        }).catch(e => {throw e})
    } catch (e) {
        notifyError('issue', e, interaction);
    }
}