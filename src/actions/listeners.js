const { log, error } = require('../utils/logger.js');

let client;

module.exports.init = async (client) => {
    this.client = client;
}

module.exports.execute = async (interaction) => {
    let command = this.client.commands.get(interaction.message.interaction.commandName);
    
    if (!command) return;
    try {
        await command.listener(interaction);
        log(`Listener "${command.data.name}" is handled`);
    } catch (e) {
        error(e);
    }
}