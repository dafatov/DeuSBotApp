const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {Collection, MessageEmbed} = require('discord.js');
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const {audit} = require('./auditor');
const config = require('../configs/config.js');
const db = require('../db/repositories/users.js');
const fs = require('fs');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

module.exports.init = async client => {
  client.commands = new Collection();
  fs.readdirSync('./src/main/js/actions/commands')
    .filter(f => !f.startsWith('_'))
    .filter(f => f.endsWith('.js'))
    .forEach(f => {
      const command = require(`./commands/${f}`);
      client.commands.set(command.data.name, command);
    });

  if (!client.commands || client.commands.size <= 0) {
    return;
  }

  await this.updateCommands(client);
};

module.exports.updateCommands = async client => {
  const rest = new REST({version: '9'}).setToken(process.env.DISCORD_TOKEN);

  await setShikimoriChoices(client.commands);
  await client.guilds.fetch()
    .then(guilds => guilds.map(guild => rest.put(
      Routes.applicationGuildCommands(client.user.id, guild.id), {
        body: client.commands.map(value => value.data.toJSON()),
      }))).then(response => Promise.all(response) ?? [])
    .then(guildsCommands => guildsCommands.map(guildCommands =>
      `${client.guilds.resolve(guildCommands[0].guild_id).name}(${guildCommands.length})`))
    .then(guilds => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.INIT,
      message: t('inner:audit.init.command', {guilds}),
    }))
    .catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.INIT,
      message: stringify(e),
    }));
};

module.exports.execute = async interaction => {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    return;
  }

  try {
    await interaction.deferReply();
    await command.execute(interaction);
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.executed', {name: command.data.name}),
    });
  } catch (e) {
    await audit({
      guildId: interaction.guildId,
      type: TYPES.ERROR,
      category: CATEGORIES.COMMAND,
      message: stringify(e),
    });
  }
};

module.exports.notify = async (commandName, interaction, content) => {
  try {
    if (interaction.commandName === commandName && !interaction.replied && !interaction.deferred) {
      await interaction.reply(content);
    } else {
      await interaction.followUp(content);
      return;
    }

    if (interaction.deferred) {
      await interaction.editReply(content);
    }
  } catch (e) {
    await audit({
      guildId: interaction.guildId,
      type: TYPES.ERROR,
      category: CATEGORIES.COMMAND,
      message: stringify(e),
    });
    interaction.message?.send(content);
  }
};

module.exports.notifyError = async (commandName, e, interaction) => {
  const embed = new MessageEmbed()
    .setColor(config.colors.error)
    .setTitle(t('discord:embed.command.notifyError.title'))
    .setTimestamp()
    .setDescription(`${stringify(e)}`);
  await this.notify(`${commandName}`, interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.ERROR,
    category: CATEGORIES.COMMAND,
    message: `[${commandName}]:\n${stringify(e)}`,
  });
};

const setShikimoriChoices = async commands => {
  const all = await db.getAll();
  commands.get('shikimori').data.options
    .filter(i => i.name === 'play')[0].options
    .filter(i => i.name === 'nickname')[0].choices = all.map(({login, nickname}) => ({name: nickname, value: login}));
};
