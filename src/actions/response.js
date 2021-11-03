import { readFile } from 'fs/promises';
import { log, error } from '../utils/logger.js';
import config from "../configs/config.js";

let rules;

export const init = () => {
    readFile(config.rulesPath, 'utf-8',)
        .then(data => rules = JSON.parse(data).rules)
        .then(() => log(rules))
        .catch(err => console.error(err));
};

export const reply = ({channel, content}) => {
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