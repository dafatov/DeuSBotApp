const { log, error } = require('../utils/logger.js');
const db = require("../repositories/responses.js");

module.exports.init = async (client) => {
    await client.guilds.cache.forEach(async guild => {
        await db.count(guild.id).then((count) => log(`Успешно зарегистрировано реакций: ${count} для гильдии: ${guild.name}`))
            .catch((e) => error(e));
    })
};

module.exports.execute = async (message) => {
    try {
        db.getAll(message.guildId).then((rules) => rules.forEach(e => {
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