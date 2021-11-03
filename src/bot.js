import { Client, Intents } from "discord.js";
//import { init as initInteractions, execute } from "./actions/interaction.js";
import { init as initResponses, reply } from "./actions/response.js";
import config from "./configs/config.js";

export const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
//initInteractions();
initResponses();

client.once('ready', () => {
	console.log('Готов к труду и обороне');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    //execute(interaction, client);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    reply(message);
});

client.login(config.token);