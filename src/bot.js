import { Client, Intents } from "discord.js";
import { init as initInteractions, execute as executeInteractions } from "./actions/interaction.js";
import { init as initResponses, execute as executeResponces } from "./actions/response.js";
import config from "./configs/config.js";
import { log } from './utils/logger.js';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', () => {
    client.commands = {}

    client.user.setPresence({ activities: [{ name: `/help for help` }], status: 'online' });

    initInteractions(client);
    initResponses();
    
	log('Готов к труду и обороне');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    
    executeInteractions(interaction);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    executeResponces(message);
});

client.login(config.token);