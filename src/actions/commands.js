const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const config = require('../configs/config.js');
const fs = require('fs');
const {log, error, logGuild} = require('../utils/logger.js');
const Collection = require('@discordjs/collection');
const {MessageEmbed} = require('discord.js');
const db = require('../db/repositories/users.js');

module.exports.init = async (client) => {
  const rest = new REST({version: '9'}).setToken(process.env.DISCORD_TOKEN);
  client.commands = new Collection();

  fs.readdirSync('./src/actions/commands')
    .filter(f => f.endsWith('.js'))
    .forEach(f => {
      const command = require(`./commands/${f}`);
      client.commands.set(command.data.name, command);
    });
  if (!client.commands || client.commands.keyArray().length === 0) {
    return;
  }

  await setShikimoriChoices(client.commands);
  await Promise.all(client.guilds.cache.map(guild =>
      rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), {
        body: client.commands.map((value) => value.data.toJSON()),
      })))
    .then(response => response ?? [])
    .then(response => response.map(r =>
      `${client.guilds.cache.get(r[0].guild_id).name}: ${r.length}`).sort().join(', '))
    .then(response => log(`Успешно зарегистрировано команд для гильдий: [${response}]`))
    .catch(e => error(e));
};

module.exports.update = async (client) => {
  const rest = new REST({version: '9'}).setToken(config.token);

  await setShikimoriChoices(client.commands);
  await Promise.all(client.guilds.cache.map(guild =>
      rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), {
        body: client.commands.map((value) => value.data.toJSON()),
      })))
    .then(response => response ?? [])
    .then(response => response.map(r =>
      `${client.guilds.cache.get(r[0].guild_id).name}: ${r.length}`).sort().join(', '))
    .then(response => log(`Успешно обновлено команд для гильдий: [${response}]`))
    .catch(e => error(e));
};

module.exports.execute = async (interaction) => {
  let command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    return;
  }
  try {
    await command.execute(interaction);
    logGuild(interaction.guildId, `Command "${command.data.name}" is executed`);
  } catch (e) {
    error(e);
  }
};

module.exports.notify = async (commandName, interaction, content) => {
  try {
    if (interaction.commandName === commandName && !interaction.replied) {
      await interaction.reply(content);
    } else {
      await interaction.followUp(content);
    }
  } catch (e) {
    error(e);
    interaction.message?.send(content);
  }
};

module.exports.notifyError = async (commandName, e, interaction) => {
  const embed = new MessageEmbed()
    .setColor(config.colors.error)
    .setTitle('Ошибка. Используйте команду /issue, чтобы сообщить о ней')
    .setTimestamp()
    .setDescription(`${e}`);
  await module.exports.notify(`${commandName}`, interaction, {embeds: [embed]});
  error(`[${commandName}]:\n${e}`);
};

const setShikimoriChoices = async (commands) => {
  let all = await db.getAll();
  commands.get('shikimori').data.options
    .filter(i => i.name === 'play')[0].options
    .filter(i => i.name === 'nickname')[0].choices = all.map(({login, nickname}) => ({
    name: nickname,
    value: login,
  }));
};
