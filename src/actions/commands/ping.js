import { SlashCommandBuilder } from '@discordjs/builders';

export default {
    data: new SlashCommandBuilder().
        setName('ping').
        setDescription('Пинг и отпинг'),
    async execute({reply, options, client}) {
        await reply(`Задержка равна ${Math.round(client.ws.ping)}мс ${options.getString("name")}`);
    }
}