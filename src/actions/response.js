import { readFile } from 'fs/promises';
import { log, error } from '../utils/logger.js';
import config from "../configs/config.js";
import { ping } from "./commands/ping.js";
import { append } from './commands/append.js';
import { help } from './commands/help.js';

export let rules = [];

export const setRules = (newRules) => {
    rules = newRules;
}

export const init = () => {
    readFile(config.rulesPath, 'utf-8',)
        .then(data => rules = JSON.parse(data))
        .then(() => log(rules))
        .catch((e) => console.log(e));
};

export const execute = async ({channel, content, client}) => {
    if (!rules) return;

    /** */
    let args = content.split(" ");
    if (args[0][0] === config.prefix) {
        intercationOld(args, {channel, content, client});
        return;
    }
    /** */

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

const intercationOld = (args, {channel, content, client}) => {
    switch (args[0].substr(1)) {
        case 'ping':
            ping(channel, client);
        break;

        case 'append':
            append(channel, {
                regex: args[1],
                react: args[2]
            });
        break;

        case 'help':
            help(channel);
        break;

        case 'play':
            if (!args[1]) return;

            // let searchResults = await ytsr(args[1], {
            //     gl: 'RU',
            //     hl: 'ru',
            //     limit: 1
            // });
            // log(`Play smth`);
            // log(searchResults.items);
        break;
    }
}