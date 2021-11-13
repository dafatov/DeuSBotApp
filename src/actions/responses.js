const { readFile } = require('fs/promises');
const { log, error } = require('../utils/logger.js');
const config = require("../configs/config.js");
const db = require("../repositories/db.js");

module.exports.init = async () => {
    await db.count().then((count) => log(`Успешно зарегистрировано реакций: ${count}`))
        .catch((e) => error(e));
};

module.exports.execute = async (message) => {
    try {
        db.getAll().then((rules) => rules.forEach(e => {
            if (!e.regex || !e.react) throw `One of response [regex: "${e.regex}", react: "${e.react}"] is not valid.\nCheck syntax!`;

            if (message.content.match(e.regex)) {
                message.reply(`${e.react}`);
                log(`Message \n\t"${message.content}" triggered \n\t"${e.regex}" and was sended \n\t"${e.react}"`);
            }
        })).catch((e) => {throw e});
    } catch (e) {
        error(e);
    }
};