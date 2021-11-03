import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import { client } from "../bot.js";
import config from "../configs/config.js";

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Пинг и отпинг')
        .addStringOption(o => o.setName('name').setDescription('desc').setRequired(true))
]
    .map(c => {c.toJSON()});
const rest = new REST({ version: '9' }).setToken(config.token);

export const init = () => {
    rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands })
	.then(() => console.log('Успешно зарегистрировал команды приложения'))
	.catch(console.error);
};

export const execute = async ({commandName, reply, options}) => {
    if (commandName === 'ping') {
        await reply(`Задержка равна ${Math.round(client.ws.ping)}мс ${options.getString("name")}`);
    }
};