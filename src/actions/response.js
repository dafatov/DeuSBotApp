import { readFile, writeFile } from 'fs/promises';
import { log, error } from '../utils/logger.js';
import config from "../configs/config.js";
import { channel } from 'diagnostics_channel';

let rules = [];

export const init = () => {
    readFile(config.rulesPath, 'utf-8',)
        .then(data => rules = JSON.parse(data))
        .then(() => log(rules))
        .catch((e) => console.log(e));
};

export const response = ({channel, content}) => {
    if (!rules) return;

    try {
        rules.forEach(e => {
            if (!e.regex || !e.react) throw `One of response [regex: "${e.regex}", react: "${e.react}"] is not valid.\nCheck syntax!`;

            if (content.match(e.regex)) {
                channel.send(`${e.react}`);
                log(`Message "${content}" triggered "${e.regex}" and was sended "${e.react}"`);
            }
        });
    } catch (e) {
        error(channel, `${e}`);
        return;
    }
};

export const append = (channel, {regex, react}) => {
    try {
        rules.forEach(e => {
            if (regex === e.regex) throw `React with added regex [${regex}] exists and has react: "${e.react}"`;
        })
    } catch (e) {
        channel.send(`${e}`);
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
        .then(() => channel.send(`Новая реакция была добавлена`))
        .catch((err) => console.error(err));
};