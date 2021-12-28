const {Client, Intents} = require("discord.js");
const responses = require("./actions/responses.js");
const commands = require("./actions/commands.js");
const listeners = require("./actions/listeners.js");
const player = require("./actions/player.js");
const changelog = require("./actions/changelog.js");
const publicist = require("./actions/publicist.js");
const radios = require("./actions/radios.js");
const config = require("./configs/config.js");
const {log, logGuild} = require('./utils/logger.js');
const db = require("./db.js");
const {VoiceConnectionStatus} = require("@discordjs/voice");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MEMBERS
  ]
});

client.once('ready', async () => {
  client.user.setPresence({activities: [{name: `/help для помощи`}], status: 'online'});

  await db.init();
  await responses.init(client);
  await radios.init();
  await commands.init(client);
  await listeners.init(client);
  player.init(client);
  await changelog.init();
  await publicist.init(client);

  log('Бот запущен');
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    await commands.execute(interaction);
  }
  if (interaction.isButton()) {
    await listeners.execute(interaction);
  }
});

client.on('messageCreate', (message) => {
  if (message.author.bot) {
    return;
  }

  responses.execute(message);
});

client.on('voiceStateUpdate', async (_oldState, newState) => {
  if (!player.getQueue(newState.guild.id)?.voiceChannel
    || !player.getQueue(newState.guild.id).connection
    || player.getQueue(newState.guild.id).connection._state.status === VoiceConnectionStatus.Destroyed) {
    return;
  }

  if (newState.id === client.user.id && (!newState.channelId || newState.channelId !== player.getQueue(newState.guild.id).voiceChannel.id)
    || player.getQueue(newState.guild.id).voiceChannel.members
      .filter(m => !m.user.bot).size < 1) {
    player.getQueue(newState.guild.id).connection.destroy();
    player.clearNowPlaying(newState.guild.id);
    player.clearQueue(newState.guild.id);
    player.clearConnection(newState.guild.id);
    logGuild(newState.guild.id, '[bot][stateUpdate] Leaved cause moved, disconnected or solo');
  }
});

client.login(config.discordToken);