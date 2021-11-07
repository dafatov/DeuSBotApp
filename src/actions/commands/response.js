const { writeFile } = require('fs/promises');
const config = require('../../configs/config.js');
const { log, error } = require('../../utils/logger.js');
const { getRules, setRule, removeRule } = require('../responses.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { notify } = require('../commands.js');

const {start, count} = {start: 0, count: 5};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('response')
        .setDescription('Манипулирование реакциями')
        .addSubcommand(s => s
            .setName('set')
            .setDescription('Добавление или изменение реакции')
            .addStringOption(o => o
                .setName('regex')
                .setDescription('Шаблон, определяющий на какое сообщение реагировать')
                .setRequired(true))
            .addStringOption(o => o
                .setName('react')
                .setDescription('Текст реакции')
                .setRequired(true)))
        .addSubcommand(s => s
            .setName('remove')
            .setDescription('Удаление существубщей реакции. Может удалять то, чего нет')
            .addStringOption(o => o
                .setName('regex')
                .setDescription('Шаблон, определяющий на какое сообщение реагировать')
                .setRequired(true)))
        .addSubcommand(s => s
            .setName('show')
            .setDescription('Отображение существующий реакций в виде списка')),
    async execute(interaction) {
        await response(interaction);
    },
    async listener(interaction) {
        await onResponse(interaction);
    }
}

const response = async (interaction) => {
    if (interaction.options.getSubcommand() === 'set') {
        await set(interaction);
    } else if (interaction.options.getSubcommand() === 'remove') {
        await remove(interaction);
    } else if (interaction.options.getSubcommand() === 'show') {
        await show(interaction);
    }
}

const onResponse = async (interaction) => {
    let subCommand = interaction.customId.split('_')[0];

    if (subCommand === 'show') {
        await onShow(interaction);
    }
};

const set = async (interaction) => {
    let {regex, react} = {
        regex: interaction.options.getString("regex"),
        react: interaction.options.getString("react")
    };
    console.log(interaction);

    try {
        if (!regex || !react) throw `Regex or react is undefined: [regex: "${regex}", react: "${react}"]`

        setRule({
            "regex": regex,
            "react": react
        });
        await writeFile(config.rulesPath, JSON.stringify(getRules(), null, 2))
            .then(async () => {
                const embed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('Я создал реакцию')
                    .setTimestamp()
                    .addField(regex, react);

                await notify('response', interaction, {embeds: [embed]});
                log(`[Response.Add] Реакция успешно добавлена`);
            })
            .catch((err) => {throw err});
    } catch (e) {
        const embed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('Ошибка')
            .setTimestamp()
            .setDescription(e);
        await notify('response', interaction, {embeds: [embed]});
        error(`[Response.Add]:\n${e}`);
        return;
    }
};

const remove = async (interaction) => {
    let regex = interaction.options.getString("regex");

    try {
        if (!regex) throw `Regex is undefined: [regex: "${regex}"]`

        removeRule(regex);
        await writeFile(config.rulesPath, JSON.stringify(getRules(), null, 2))
            .then(async () => {
                const embed = new MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle('Я уничтожил реакцию')
                    .setTimestamp()
                    .setDescription(regex);

                await notify('response', interaction, {embeds: [embed]});
                log(`[Response.Remove] Реакция успешно удалена`);
            })
            .catch((err) => {throw err});
    } catch (e) {
        const embed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('Ошибка')
            .setTimestamp()
            .setDescription(e);
        await notify('response', interaction, {embeds: [embed]});
        error(`[Response.Remove]:\n${e}`);
        return;
    }
};

const show = async (interaction) => {
    const rules = getRules();

    const embed = new MessageEmbed()
        .setColor('#000000')
        .setTitle('Все реакции на текущий момент')
        .setFooter(`${Math.min(start + 1, rules.length)} - ${Math.min(start + count, rules.length)} из ${rules.length} по ${count}`);

    embed.setFields(rules
        .slice(start, count)
        .map(rule => ({
            name: rule.regex,
            value: rule.react
        }))
    );

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('show_previous')
                .setLabel('Previous')
                .setStyle('PRIMARY')
                .setDisabled(start <= 0),
            new MessageButton()
                .setCustomId('show_next')
                .setLabel('Next')
                .setStyle('PRIMARY')
                .setDisabled(start + count >= getRules().length),
        );

    try {
        await notify('response', interaction, {embeds: [embed], components: [row]});
        log(`[Response.Show] Список реакций успешно выведен`);
    } catch (e) {
        error(`[Response.Show]:\n${e}`)
    }
};

const onShow = async (interaction) => {
    let embed = interaction.message.embeds[0];
    let row = interaction.message.components[0];
    let {start, count} = calcPages(embed.footer.text);

    if (interaction.customId === 'show_next') start += count;
    if (interaction.customId === 'show_previous') start -= count;
    
    row.components.forEach(b => {
        if (b.customId === 'show_next') {
            b.setDisabled(start + count >= getRules().length);
        }
        if (b.customId === 'show_previous') {
            b.setDisabled(start <= 0);
        }
    })

    embed.setFields(getRules()
        .slice(start, start + count)
        .map(rule => ({
            name: rule.regex,
            value: rule.react
        })))
    .setFooter(`${start + 1} - ${Math.min(start + count, getRules().length)} из ${getRules().length} по ${count}`);

    try {
        await notify('response', interaction, {embeds: [embed], components: [row]});
        log(`[Response.Show] Список реакций успешно обновлен`);
    } catch (e) {
        error(`[Response.Show]:\n${e}`)
    }
}

function calcPages(footer) {
    let array = footer.split(' ');
    return {start: array[0] - 1, count: parseInt(array[6])};
}