import { writeFile } from 'fs/promises';
import { SlashCommandBuilder } from '@discordjs/builders';
import { rules } from '../response.js';

export default {
    data: new SlashCommandBuilder()
        .setName('addRule')
        .setDescription('Добавить правило реакции на сообщения')
        .addStringOption(o => o.setName('regex')
            .setDescription('Шаблон, провоцирующий реакцию')
            .setRequired(true))
        .addStringOption(o => o.setName('react')
            .setDescription('Текст сообщения реакции')
            .setRequired(true)),
    async execute({reply, options}) {
        append(reply, {
            regex: options.getString("regex"),
            react: options.getString("react")
        });
    }
}

const append = (reply, {regex, react}) => {
    try {
        if (!regex || !react) throw `Regex or react is undefined: [regex: "${regex}", react: "${react}"]`
        rules.forEach(e => {
            if (regex === e.regex) throw `React with added regex [${regex}] exists and has react: "${e.react}"`;
        })
    } catch (e) {
        reply(`${e}`);
        return;
    }

    rules = [
        ...rules,
        {
            "regex": regex,
            "react": react
        }
    ]
    writeFile(config.rulesPath, JSON.stringify(rules, null, 2))
        .then(() => log(rules))
        .then(() => reply(`Новая реакция была добавлена`))
        .catch((err) => console.error(err));
};