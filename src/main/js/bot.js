const {CATEGORIES, TYPES} = require('./db/repositories/audit');
const {Client, Events, GatewayIntentBits} = require('discord.js');
const {audit} = require('./actions/auditor');
const locale = require('./configs/locale');
const {t} = require('i18next');
const {version} = require('../../../package.json');

const client = new Client({
  intents: [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, async () => {
  client.user.setPresence({activities: [{name: t('discord:presence', {version})}], status: 'online'});

  await require('./actions/db').init();
  await require('./actions/auditor').init();
  await require('./actions/radios').init();
  await require('./actions/commands').init(client);
  await require('./actions/player').init(client);
  await require('./actions/changelog').init();
  await require('./actions/publicist').init(client);
  await require('./server').init(client);
  await require('./actions/backup').init(client);

  await audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.bot'),
  });
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isCommand()) {
    await require('./actions/commands').execute(interaction);
  } else if (interaction.isButton()) {
    await require('./actions/listeners').onButton(interaction);
  } else if (interaction.isModalSubmit()) {
    await require('./actions/listeners').onModal(interaction);
  } else if (interaction.isStringSelectMenu()) {
    await require('./actions/listeners').onSelect(interaction);
  }
});

client.on(Events.MessageCreate, message =>
  require('./events/messageCreate').execute(client, message));

client.on(Events.VoiceStateUpdate, (oldState, newState) =>
  require('./events/voiceStateUpdate').execute(client, oldState, newState));

locale.init().then(() => client.login(process.env.DISCORD_TOKEN));
