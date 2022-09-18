const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const config = require('../configs/config.js');
const fs = require('fs');
const {MessageEmbed, Collection} = require('discord.js');
const db = require('../db/repositories/users.js');
const {audit} = require('./auditor');
const {TYPES, CATEGORIES} = require('../db/repositories/audit');
const {stringify} = require('../utils/string');

module.exports.init = async (client) => {
  client.commands = new Collection();
  fs.readdirSync('./src/actions/commands')
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

module.exports.updateCommands = async (client) => {
  const rest = new REST({version: '9'}).setToken(process.env.DISCORD_TOKEN);

  await setShikimoriChoices(client.commands);
  await client.guilds.fetch()
    .then(guilds => guilds.map(guild => rest.put(
      Routes.applicationGuildCommands(client.user.id, guild.id), {
        body: client.commands.map(value => value.data.toJSON()),
      })))
    .then(response => Promise.all(response) ?? [])
    .then(guildsCommands => guildsCommands.map(guildCommands =>
      `${client.guilds.resolve(guildCommands[0].guild_id).name}: ${guildCommands.length}`).sort().join(', '))
    .then(guildsLog => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.INIT,
      message: `Успешно зарегистрировано команд для гильдий: [${guildsLog}]`,
    }))
    .catch(error => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.INIT,
      message: stringify(error),
    }));
};

module.exports.execute = async (interaction) => {
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
      message: `Command "${command.data.name}" is executed`,
    });
  } catch (error) {
    await audit({
      guildId: interaction.guildId,
      type: TYPES.ERROR,
      category: CATEGORIES.COMMAND,
      message: stringify(error),
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
  } catch (error) {
    await audit({
      guildId: interaction.guildId,
      type: TYPES.ERROR,
      category: CATEGORIES.COMMAND,
      message: stringify(error),
    });
    interaction.message?.send(content);
  }
};

module.exports.notifyError = async (commandName, e, interaction) => {
  const embed = new MessageEmbed()
    .setColor(config.colors.error)
    .setTitle('Ошибка. Используйте команду /issue, чтобы сообщить о ней')
    .setTimestamp()
    .setDescription(`${e}`);
  await this.notify(`${commandName}`, interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.ERROR,
    category: CATEGORIES.COMMAND,
    message: `[${commandName}]:\n${e}`,
  });
};

const setShikimoriChoices = async (commands) => {
  const all = await db.getAll();
  commands.get('shikimori').data.options
    .filter(i => i.name === 'play')[0].options
    .filter(i => i.name === 'nickname')[0].choices = all.map(({login, nickname}) => ({
    name: nickname,
    value: login,
  }));
};
