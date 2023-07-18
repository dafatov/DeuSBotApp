const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {Collection, EmbedBuilder, REST, Routes} = require('discord.js');
const {getCommandName, stringify} = require('../utils/string');
const {audit} = require('./auditor');
const config = require('../configs/config');
const first = require('lodash/first');
const fs = require('fs');
const {getSize} = require('./player');
const {t} = require('i18next');

module.exports.init = async client => {
  client.commands = new Collection();
  fs.readdirSync('./src/main/js/actions/commands')
    .filter(fileName => !fileName.startsWith('_'))
    .filter(fileName => fileName.endsWith('.js'))
    .forEach(fileName => client.commands.set(getCommandName(fileName), require(`./commands/${fileName}`)));

  if (client.commands.size <= 0) {
    return;
  }

  await this.updateCommands(client);
};

module.exports.updateCommands = client => Promise.resolve(new REST({version: '10'}))
  .then(rest => rest.setToken(process.env.DISCORD_TOKEN))
  .then(rest => this.getCommandsData(client)
    .then(commandsData => client.guilds.fetch()
      .then(guilds => Promise.all(guilds.map(guild => rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id), {
          body: commandsData,
        },
      ))))))
  .then(guildsCommands => Promise.all(guildsCommands
    .map(guildCommands => client.guilds.fetch(first(guildCommands).guild_id)
      .then(guild => `${guild.name}(${guildCommands.length})`))))
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

module.exports.execute = async interaction => {
  const commandName = interaction.commandName;
  const command = interaction.client.commands.get(commandName);

  if (typeof command?.execute !== 'function') {
    return;
  }

  if (JSON.parse(process.env.RESTRICTED_COMMANDS ?? '[]').includes(commandName)) {
    this.notifyRestricted(commandName, interaction);
    return;
  }

  try {
    if (await command.isDeferReply?.(interaction) ?? true) {
      await interaction.deferReply();
    }

    await command.execute(interaction);
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.executed', {name: commandName}),
    });
  } catch (e) {
    await notifyError(commandName, interaction, e);
  }
};

module.exports.notify = async (interaction, content) => {
  try {
    if (interaction.isRepliable() && !interaction.replied) {
      if (interaction.deferred) {
        await interaction.editReply(content);
      } else {
        await interaction.reply(content);
      }
    } else {
      await interaction.followUp(content);
    }
  } catch (e) {
    await audit({
      guildId: interaction.guildId,
      type: TYPES.ERROR,
      category: CATEGORIES.COMMAND,
      message: stringify(e),
    });
  }
};

module.exports.notifyForbidden = async (commandName, interaction) => {
  const embed = new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle(t('discord:embed.forbidden.title', {command: commandName}))
    .setTimestamp()
    .setDescription(t('discord:embed.forbidden.description'));
  await this.notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.PERMISSION,
    message: t('inner:info.forbidden', {command: commandName}),
  });
};

module.exports.notifyRestricted = async (commandName, interaction) => {
  const embed = new EmbedBuilder()
    .setColor(config.colors.warning)
    .setTitle(t('discord:embed.restricted.title', {command: commandName}))
    .setTimestamp()
    .setDescription(t('discord:embed.restricted.description'));
  await this.notify(interaction, {embeds: [embed], ephemeral: true});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:info.restricted', {command: commandName}),
  });
};

module.exports.notifyNoPlaying = async (commandName, interaction, isExecute = true) => {
  if (isExecute) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    await this.notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.WARNING,
    category: CATEGORIES.COMMAND,
    message: t('inner:info.noPlaying', {command: commandName}),
  });
};

module.exports.notifyUnequalChannels = async (commandName, interaction, isExecute) => {
  if (isExecute) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unequalChannels.title'))
      .setDescription(t('discord:embed.unequalChannels.description'))
      .setTimestamp();
    await this.notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.WARNING,
    category: CATEGORIES.COMMAND,
    message: t('inner:info.unequalChannels', {command: commandName}),
  });
};

module.exports.notifyIsLive = async (commandName, interaction, isExecute) => {
  if (isExecute) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.isLive.title'))
      .setDescription(t('discord:embed.isLive.description'))
      .setTimestamp();
    await this.notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.WARNING,
    category: CATEGORIES.COMMAND,
    message: t('inner:info.isLive', {command: commandName}),
  });
};

module.exports.notifyUnbound = async (commandName, interaction, isExecute) => {
  if (isExecute) {
    const length = await getSize(interaction.guildId);
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unbound.title'))
      .setDescription(t('discord:embed.unbound.description', {length}))
      .setTimestamp();
    await this.notify(interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.WARNING,
    category: CATEGORIES.COMMAND,
    message: t('inner:info.unbound', {command: commandName}),
  });
};

module.exports.getCommandsData = client =>
  Promise.all(client.commands.map(command => Promise.resolve(command.data()).then(commandData => commandData.toJSON())));

const notifyError = async (commandName, interaction, e) => {
  const {id} = await audit({
    guildId: interaction.guildId,
    type: TYPES.ERROR,
    category: CATEGORIES.COMMAND,
    message: stringify(e),
  });
  const embed = new EmbedBuilder()
    .setColor(config.colors.error)
    .setTitle(t('discord:embed.error.title'))
    .setDescription(t('discord:embed.error.description', {command: commandName, auditId: id}))
    .setTimestamp();
  await this.notify(interaction, {embeds: [embed]});
};
