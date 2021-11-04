import { Client, Intents } from "discord.js";
//import { init as initInteractions, execute } from "./actions/interaction.js";
import { init as initResponses, response } from "./actions/response.js";
import config from "./configs/config.js";
import { log, error } from './utils/logger.js';

export const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
//initInteractions();
initResponses();

client.once('ready', () => {
    client.user.setPresence({ activities: [{ name: `/help for help` }], status: 'online' });
	log('Готов к труду и обороне');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    //execute(interaction);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    response(message);
});

client.login(config.token);