// import { SlashCommandBuilder } from '@discordjs/builders';

// export default {
//     data: new SlashCommandBuilder().
//         setName('ping').
//         setDescription('Пинг и отпинг'),
//     async execute({channel, client}) {
//         await ping(channel, client);
//     }
// }

export const ping = (channel, client) => {
    channel.send(`Задержка равна ${Math.round(client.ws.ping)}мс`);
}