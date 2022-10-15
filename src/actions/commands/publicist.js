const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyError} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const db = require('../../db/repositories/publicist.js');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('publicist')
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
  async execute(interaction) {
    await publicist(interaction);
  },
};

const publicist = async interaction => {
  if (interaction.options.getSubcommand() === 'set') {
    await set(interaction);
  } else if (interaction.options.getSubcommand() === 'remove') {
    await remove(interaction);
  } else if (interaction.options.getSubcommand() === 'show') {
    await show(interaction);
  }
};

const set = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_SET)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'publicist set'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('publicist', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'publicist.set'}),
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  try {
    await db.set(interaction.guildId, channel.id);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.publicist.set.completed.title'))
      .setDescription(t('discord:command.publicist.set.completed.description', {channel: channel.name}))
      .setTimestamp();
    await notify('publicist', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.publicist.set'),
    });
  } catch (e) {
    await notifyError('publicist', e, interaction);
  }
};

const remove = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'publicist remove'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('publicist', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'publicist.remove'}),
    });
    return;
  }

  try {
    await db.remove(interaction.guildId);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.publicist.remove.completed.title'))
      .setDescription(t('discord:command.publicist.remove.completed.description'))
      .setTimestamp();
    await notify('publicist', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.publicist.remove'),
    });
  } catch (e) {
    await notifyError('publicist', e, interaction);
  }
};

const show = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_SHOW)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'publicist show'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('publicist', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'publicist.show'}),
    });
    return;
  }

  try {
    const channelId = (await db.getAll()).find(p => p.guildId === interaction.guildId)?.channelId;
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.publicist.show.completed.title', {name: interaction.guild.name}))
      .setDescription(t('discord:command.publicist.show.completed.description', {name: interaction.guild.channels.resolve(channelId)?.name}))
      .setTimestamp();
    await notify('publicist', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.publicist.show'),
    });
  } catch (e) {
    await notifyError('publicist', e, interaction);
  }
};
