const { log, error } = require('../utils/logger.js');

let client;

module.exports.init = async (c) => {
    client = c;
}

module.exports.execute = async (interaction) => {
    if (!interaction || !interaction.message || !interaction.message.interaction ||
        !interaction.message.interaction.commandName) {
            error('Ineraction was lost in listener');
            return;
    }
    let command = client.commands.get(interaction.message.interaction.commandName);
    
    if (!command) return;
    try {
        await command.listener(interaction);
    } catch (e) {
        error(e);
    }
}