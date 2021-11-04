import { writeFile } from 'fs/promises';
import config from '../../configs/config.js';
import { log } from '../../utils/logger.js';
import { rules, setRules } from '../response.js';
// import { SlashCommandBuilder } from '@discordjs/builders';

// export default {
//     data: new SlashCommandBuilder()
//         .setName('addRule')
//         .setDescription('Добавить правило реакции на сообщения')
//         .addStringOption(o => o.setName('regex')
//             .setDescription('Шаблон, провоцирующий реакцию')
//             .setRequired(true))
//         .addStringOption(o => o.setName('react')
//             .setDescription('Текст сообщения реакции')
//             .setRequired(true)),
//     async execute({channel, options}) {
//         await append(channel, {
//             regex: options.getString("regex"),
//             react: options.getString("react")
//         });
//     }
// }

export const append = (channel, {regex, react}) => {
    try {
        if (!regex || !react) throw `Regex or react is undefined: [regex: "${regex}", react: "${react}"]`
        rules.forEach(e => {
            if (regex === e.regex) throw `React with added regex [${regex}] exists and has react: "${e.react}"`;
        })
    } catch (e) {
        channel.send(`${e}`);
        return;
    }

    setRules([
        ...rules,
        {
            "regex": regex,
            "react": react
        }
    ]);
    writeFile(config.rulesPath, JSON.stringify(rules, null, 2))
        .then(() => log(rules))
        .then(() => channel.send(`Новая реакция была добавлена`))
        .catch((err) => console.error(err));
};