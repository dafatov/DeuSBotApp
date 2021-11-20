const { Client, Intents } = require("discord.js");
const responses = require("./actions/responses.js");
const commands = require("./actions/commands.js");
const listeners = require("./actions/listeners.js");
const player = require("./actions/player.js");
const config = require("./configs/config.js");
const { log } = require('./utils/logger.js');
const db = require("./db.js");

const client = new Client({ intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES
]});

client.once('ready', async () => {
    client.user.setPresence({ activities: [{ name: `/help для помощи`}], status: 'online' });

    await db.init();    
    await responses.init();
    await commands.init(client);
    await listeners.init(client);
    await player.init(client);
    
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

client.on('voiceStateUpdate', async (_oldState, newState) => {
    if (!client.queue || !client.queue.voiceChannel) return;

    if (newState.id === client.user.id && !newState.channelId
        || client.queue.voiceChannel.members
            .filter(m => !m.user.bot).size < 1) {
                client.queue.connection.destroy();
                player.clearNowPlaying(client);
                player.clearQueue(client);
    }
});

client.login(config.token);