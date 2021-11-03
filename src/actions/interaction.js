import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import { client } from "../bot.js";
import { append } from './response.js';
import config from "../configs/config.js";

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Пинг и отпинг'),
    new SlashCommandBuilder().setName('addRule').setDescription('Добавить правило реакции на сообщения')
        .addStringOption(o => o.setName('regex').setDescription('Шаблон, провоцирующий реакцию').setRequired(true))
        .addStringOption(o => o.setName('react').setDescription('Текст сообщения реакции').setRequired(true))
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
    } else if (commandName === 'addRule') {
        append(reply, {
            regex: options.getString("regex"),
            react: options.getString("react")
        });
    }
};