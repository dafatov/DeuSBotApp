const {CATEGORIES, TYPES} = require('./db/repositories/audit');
const {Client, Intents} = require('discord.js');
const {audit} = require('./actions/auditor');
const locale = require('../locales/locale');
const {t} = require('i18next');
const {version} = require('../package');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});

client.once('ready', async () => {
  client.user.setPresence({activities: [{name: t('discord:presence', {version})}], status: 'online'});

  await require('./actions/db.js').init();
  await require('./actions/auditor.js').init();
  await require('./actions/radios.js').init();
  await require('./actions/commands.js').init(client);
  await require('./actions/listeners.js').init(client);
  await require('./actions/player.js').init(client);
  await require('./actions/changelog.js').init();
  await require('./actions/publicist.js').init(client);
  await require('./server').init(client);

  await audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.bot'),
  });
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    await require('./actions/commands.js').execute(interaction);
  }
  if (interaction.isButton()) {
    await require('./actions/listeners.js').execute(interaction);
  }
});

client.on('messageCreate', message =>
  require('./events/messageCreate').execute(client, message));

client.on('voiceStateUpdate', (oldState, newState) =>
  require('./events/voiceStateUpdate').execute(client, oldState, newState));

locale.init().then(() => client.login(process.env.DISCORD_TOKEN));
