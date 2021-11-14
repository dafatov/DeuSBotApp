const config = require('../../configs/config.js');
const { log } = require('../../utils/logger.js');
const db = require('../../repositories/db.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { notify, notifyError } = require('../commands.js');
const { escaping } = require('../../utils/string.js');

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

const set = async (interaction) => {
    let {regex, react} = {
        regex: interaction.options.getString("regex"),
        react: interaction.options.getString("react")
    };

    try {
        if (!regex || !react) throw `Regex or react is undefined: [regex: "${regex}", react: "${react}"]`

        try {
            "test".match(regex);
        } catch(e) {
            throw `Некорретное регулярное выражение: ${regex}`
        }

        db.set({
            "regex": regex,
            "react": react
        }).then(async () => {
            const embed = new MessageEmbed()
                .setColor(config.colors.info)
                .setTitle('Я создал реакцию')
                .setTimestamp()
                .addField(escaping(regex), react);

            await notify('response', interaction, {embeds: [embed]});
            log(`[response] Реакция успешно добавлена`);
        }).catch((err) => {throw err});
    } catch (e) {
        await notifyError('response', e, interaction);
    }
};

const remove = async (interaction) => {
    let regex = interaction.options.getString("regex");

    try {
        if (!regex) throw `Regex is undefined: [regex: "${regex}"]`

        db.delete(regex).then(async () => {
            const embed = new MessageEmbed()
                .setColor(config.colors.info)
                .setTitle('Я уничтожил реакцию')
                .setTimestamp()
                .setDescription(escaping(regex));

            await notify('response', interaction, {embeds: [embed]});
            log(`[response] Реакция успешно удалена`);
        }).catch((err) => {throw err});
    } catch (e) {
        notifyError('response', e, interaction);
    }
};

const show = async (interaction) => {
    db.getAll().then(async rules => {
        const embed = new MessageEmbed()
            .setColor('#000000')
            .setTitle('Все реакции на текущий момент')
            .setFooter(`${Math.min(start + 1, rules.length)} - ${Math.min(start + count, rules.length)} из ${rules.length} по ${count}`);

        embed.setFields(rules
            .slice(start, count)
            .map(rule => ({
                name: escaping(rule.regex),
                value: rule.react
            }))
        );

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle('PRIMARY')
                    .setDisabled(start <= 0),
                    new MessageButton()
                        .setCustomId('update')
                        .setLabel('Update')
                        .setStyle('PRIMARY')
                        .setDisabled(rules.length === 0),
                new MessageButton()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle('PRIMARY')
                    .setDisabled(start + count >= rules.length),
            );

        try {
            await notify('response', interaction, {embeds: [embed], components: [row]});
            log(`[response] Список реакций успешно выведен`);
        } catch (e) {
            notifyError('response', e, interaction);
        }
    })
};

const onResponse = async (interaction) => {
    db.getAll().then(async rules => {
        let embed = interaction.message.embeds[0];
        let row = interaction.message.components[0];
        let {start, count} = calcPages(embed.footer.text);

        if (interaction.customId === 'next') start += count;
        if (interaction.customId === 'previous') start -= count;
        if (interaction.customId === 'update') start = Math.min(start, rules.length - 1);
        
        row.components.forEach(b => {
            if (b.customId === 'next') {
                b.setDisabled(start + count >= rules.length);
            }
            if (b.customId === 'previous') {
                b.setDisabled(start <= 0);
            }
            if (b.customId === 'update') {
                b.setDisabled(rules.length === 0);
            }
        })

        embed.setFields(rules
            .slice(start, start + count)
            .map(rule => ({
                name: escaping(rule.regex),
                value: rule.react
            })))
            //Данные количества на странице (count) беруться из footer'а. Да, костыль
        .setFooter(`${start + 1} - ${Math.min(start + count, rules.length)} из ${rules.length} по ${count}`);

        try {
            await interaction.update({embeds: [embed], components: [row]});
        } catch (e) {
            notifyError('response', e, interaction);
        }
    });
}

function calcPages(footer) {
    let array = footer.split(' ');
    return {start: array[0] - 1, count: parseInt(array[6])};
}