const { readFile } = require('fs/promises');
const { log, error } = require('../utils/logger.js');
const config = require("../configs/config.js");

let rules = [];

module.exports.addRule = (rule) => {
    rules = [
        ...rules,
        rule
    ]
}

module.exports.removeRule = (regex) => {
    rules = rules.filter(rule => rule.regex !== regex)
}

module.exports.getRules = () => {
    return rules;
}

module.exports.init = async () => {
    await readFile(config.rulesPath, 'utf-8',)
        .then(data => rules = JSON.parse(data))
        .then(() => log(`Успешно зарегистрировано реакций: ${rules.length}`))
        .catch((e) => error(e));
};

module.exports.execute = async (message) => {
    if (!rules) return;

    try {
        rules.forEach(e => {
            if (!e.regex || !e.react) throw `One of response [regex: "${e.regex}", react: "${e.react}"] is not valid.\nCheck syntax!`;

            if (message.content.match(e.regex)) {
                message.reply(`${e.react}`);
                log(`Message \n\t"${message.content}" triggered \n\t"${e.regex}" and was sended \n\t"${e.react}"`);
            }
        });
    } catch (e) {
        error(e);
        return;
    }
};