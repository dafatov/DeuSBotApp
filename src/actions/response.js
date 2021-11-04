import { readFile, writeFile } from 'fs/promises';
import { log, error } from '../utils/logger.js';
import config from "../configs/config.js";

let rules = [];

export const init = () => {
    readFile(config.rulesPath, 'utf-8',)
        .then(data => rules = JSON.parse(data))
        .then(() => log(rules))
        .catch((e) => console.log(e));
};

export const execute = async ({channel, content}) => {
    if (!rules) return;

    /** */
    let args = content.split(" ");
    if (args[0][0] === config.prefix) {
        switch (args[0].substr(1)) {
            case 'ping':
                log('ping');
            break;

            case 'append':
                if (!args[1] || !args[2]) return;

                log('append');
            break;

            case 'play':
                if (!args[1]) return;

                
                log('play');

                // let searchResults = await ytsr(args[1], {
                //     gl: 'RU',
                //     hl: 'ru',
                //     limit: 1
                // });
                // log(searchResults.items);
            break;
        }
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