const { Client, Intents } = require("discord.js");
const responses = require("./actions/responses.js");
const commands = require("./actions/commands");
const listeners = require("./actions/listeners");
const config = require("./configs/config.js");
const { log } = require('./utils/logger.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.once('ready', async () => {
    client.user.setPresence({ activities: [{ name: `/help для помощи`}], status: 'online' });

    await responses.init();
    await commands.init(client);
    await listeners.init(client);
    
	log('Бот запущен');
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) await commands.execute(interaction);
    if (interaction.isButton()) await listeners.execute(interaction);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    responses.execute(message);
});

client.login(config.token);