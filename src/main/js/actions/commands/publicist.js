const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyForbidden} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const db = require('../../db/repositories/publicist');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.publicist.description'))
    .addSubcommand(s => s
      .setName('set')
      .setDescription(t('discord:command.publicist.set.description'))
      .addChannelOption(c => c
        .setName('channel')
        .setDescription(t('discord:command.publicist.set.option.channel.description'))
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription(t('discord:command.publicist.remove.description')))
    .addSubcommand(s => s
      .setName('show')
      .setDescription(t('discord:command.publicist.show.description'))),
  execute: interaction => publicist(interaction),
};

const publicist = interaction => {
  switch (interaction.options.getSubcommand()) {
    case 'set':
      return set(interaction);
    case 'remove':
      return remove(interaction);
    case 'show':
      return show(interaction);
  }
};

const set = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_SET)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const channel = interaction.options.getChannel('channel');

  await db.set(interaction.guildId, channel.id);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.publicist.set.completed.title'))
    .setDescription(t('discord:command.publicist.set.completed.description', {channel: channel.name}))
    .setTimestamp();
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.publicist.set'),
  });
};

const remove = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_REMOVE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  await db.remove(interaction.guildId);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.publicist.remove.completed.title'))
    .setDescription(t('discord:command.publicist.remove.completed.description'))
    .setTimestamp();
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.publicist.remove'),
  });
};

const show = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_SHOW)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const channelId = await db.getAll()
    .then(pairs => pairs.find(pair => pair.guildId === interaction.guildId)?.channelId);

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.publicist.show.completed.title', {name: interaction.guild.name}))
    .setDescription(t('discord:command.publicist.show.completed.description', {name: interaction.guild.channels.resolve(channelId)?.name}))
    .setTimestamp();
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.publicist.show'),
  });
};
