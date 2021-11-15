const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require("../configs/config.js");
const fs = require('fs');
const { log, error } = require('../utils/logger.js');
const Collection = require('@discordjs/collection');
const { MessageEmbed } = require('discord.js');

module.exports.init = async (client) => {
    const rest = new REST({ version: '9' }).setToken(config.token);
    client.commands = new Collection();

    fs.readdirSync('./src/actions/commands')
        .filter(f => f.endsWith('.js'))
        .forEach(f => {
            const command = require(`./commands/${f}`);
            client.commands.set(command.data.name, command);
        });
    if (!client.commands || client.commands.keyArray().length === 0) return;
    await client.guilds.cache.forEach(async guild => {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), {
            body: client.commands.map((value) => value.data.toJSON())
        }).then(() => log(`Успешно зарегистрировал команд: ${client.commands.keyArray().length} для гильдии: ${guild.name}`))
        .catch((e) => error(e));
    })
};

module.exports.execute = async (interaction) => {
    let command = interaction.client.commands.get(interaction.commandName);
    
    if (!command) return;
    try {
        await command.execute(interaction);
        log(`Command "${command.data.name}" is executed`);
    } catch (e) {
        error(e);
    }
}

module.exports.notify = async (commandName, interaction, content) => {
    if (interaction.commandName === commandName && !interaction.replied) {
        await interaction.reply(content);
    } else {
        interaction.channel.send(content);
    }
}

module.exports.notifyError = async (commandName, e, interaction) => {
    const embed = new MessageEmbed()
        .setColor(config.colors.error)
        .setTitle('Ошибка')
        .setTimestamp()
        .setDescription(`${e}`);
    await module.exports.notify(`${commandName}`, interaction, {embeds: [embed]});
    error(`[${commandName}]:\n${e}`);
}