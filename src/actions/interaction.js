import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import config from "../configs/config.js";
import fs from 'fs';
import { error, log } from '../utils/logger.js'
import Collection from '@discordjs/collection';
import { channel } from 'diagnostics_channel';

export const init = (client) => {
    let rest = new REST({ version: '9' }).setToken(config.token);
    client.commands = new Collection();

    fs.readdirSync('./src/actions/commands')
        .filter(f => f.endsWith('.js'))
        .forEach(f => {
            import(`./commands/${f}`)
                .then(command => {
                    client.commands.set(command.data.name, command);
                })
                .catch(err => log(err));
        });;

    if (!client.commands || client.commands.keyArray().length === 0) return;
    rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: client.commands.map(({value}) => value.data.toJson())
    }).then(() => console.log('Успешно зарегистрировал команды приложения'))
	.catch(console.error);
};

export const execute = async (interaction) => {
    let command = client.commands.get(interaction.commandName);
    
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (e) {
        error(channel, `${e}`)
    }
}