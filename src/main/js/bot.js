const {CATEGORIES, TYPES} = require('./db/repositories/audit');
const {Client, Intents} = require('discord.js');
const {audit} = require('./actions/auditor');
const locale = require('./configs/locale');
const {t} = require('i18next');
const {version} = require('../../../package.json');

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

  await require('./actions/db').init();
  await require('./actions/auditor').init();
  await require('./actions/radios').init();
  await require('./actions/commands').init(client);
  await require('./actions/player').init(client);
  await require('./actions/changelog').init();
  await require('./actions/publicist').init(client);
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
    await require('./actions/commands').execute(interaction);
  } else if (interaction.isButton()) {
    await require('./actions/listeners').execute(interaction);
  }
});

client.on('messageCreate', message =>
  require('./events/messageCreate').execute(client, message));

client.on('voiceStateUpdate', (oldState, newState) =>
  require('./events/voiceStateUpdate').execute(client, oldState, newState));

locale.init().then(() => client.login(process.env.DISCORD_TOKEN));
