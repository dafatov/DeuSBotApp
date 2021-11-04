import { readFile } from 'fs/promises';
import { log, error } from '../utils/logger.js';
import config from "../configs/config.js";

export let rules = [];

export const init = () => {
    readFile(config.rulesPath, 'utf-8',)
        .then(data => rules = JSON.parse(data))
        .then(() => log(rules))
        .catch((e) => console.log(e));
};

export const execute = async ({channel, content}) => {
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