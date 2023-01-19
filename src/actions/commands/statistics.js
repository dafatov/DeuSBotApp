const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {comparePostgresInterval, localePostgresInterval} = require('../../utils/dateTime');
const {executePagination, getPagination, getPaginationPages} = require('../../utils/components');
const {notify, notifyError} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {getAll: getAllSessions} = require('../../db/repositories/session');
const {getAll: getAllStatistics} = require('../../db/repositories/statistics');
const {t} = require('i18next');

const {start, count} = {start: 0, count: 5};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('statistics')
    .setDescription(t('discord:command.statistics.description'))
    .addSubcommand(s => s
      .setName('session')
      .setDescription(t('discord:command.statistics.session.description')))
    .addSubcommand(s => s
      .setName('messages')
      .setDescription(t('discord:command.statistics.messages.description')))
    .addSubcommand(s => s
      .setName('voices')
      .setDescription(t('discord:command.statistics.voices.description'))),
  async execute(interaction) {
    await statistics(interaction);
  },
  async listener(interaction) {
    await onStatistics(interaction);
  },
};

const statistics = async interaction => {
  if (interaction.options.getSubcommand() === 'session') {
    await session(interaction);
  } else if (interaction.options.getSubcommand() === 'messages') {
    await messages(interaction);
  } else if (interaction.options.getSubcommand() === 'voices') {
    await voices(interaction);
  }
};

const onStatistics = async interaction => {
  const subCommand = interaction.message.interaction.commandName.split(' ')[1];

  if (subCommand === 'session') {
    await onSession(interaction);
  } else if (subCommand === 'messages') {
    await onMessages(interaction);
  } else if (subCommand === 'voices') {
    await onVoices(interaction);
  }
};

const session = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_SESSION)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'statistics session'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('statistics', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'statistics.session'}),
    });
    return;
  }

  const allSessions = await getAllSessions();
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.session.completed.title'))
    .setTimestamp()
    .setFields(await getAllSessionsFields(interaction, {start, count}, allSessions))
    .setFooter(t('discord:command.statistics.session.completed.footer', {
      countStart: Math.min(start + 1, allSessions.length),
      countFinish: Math.min(start + count, allSessions.length),
      total: allSessions.length,
      step: count,
    }));

  const row = getPagination(start, count, allSessions.length);

  try {
    await notify('statistics', interaction, {embeds: [embed], components: [row]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.statistics.session'),
    });
  } catch (e) {
    await notifyError('statistics', e, interaction);
  }
};

const onSession = async interaction => {
  const allSessions = await getAllSessions();
  const embed = interaction.message.embeds[0];
  const row = interaction.message.components[0];
  const pages = getPaginationPages(embed.footer.text);
  const count = pages.count;
  const start = executePagination(interaction, pages, allSessions.length);

  embed
    .setFields(await getAllSessionsFields(interaction, {start, count}, allSessions))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter(t('discord:command.statistics.session.completed.footer', {
      countStart: Math.min(start + 1, allSessions.length),
      countFinish: Math.min(start + count, allSessions.length),
      total: allSessions.length,
      step: count,
    }));

  try {
    await interaction.update({embeds: [embed], components: [row]});
  } catch (e) {
    await notifyError('statistics', e, interaction);
  }
};

const messages = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_MESSAGES)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'statistics messages'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('statistics', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'statistics.messages'}),
    });
    return;
  }

  const allStatistics = await getAllStatistics();
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.messages.completed.title'))
    .setTimestamp()
    .setFields(await getAllMessagesFields(interaction, {start, count}, allStatistics))
    .setFooter(t('discord:command.statistics.messages.completed.footer', {
      countStart: Math.min(start + 1, allStatistics.length),
      countFinish: Math.min(start + count, allStatistics.length),
      total: allStatistics.length,
      step: count,
    }));

  const row = getPagination(start, count, allStatistics.length);

  try {
    await notify('statistics', interaction, {embeds: [embed], components: [row]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.statistics.messages'),
    });
  } catch (e) {
    await notifyError('statistics', e, interaction);
  }
};

const onMessages = async interaction => {
  const allStatistics = await getAllStatistics();
  const embed = interaction.message.embeds[0];
  const row = interaction.message.components[0];
  const pages = getPaginationPages(embed.footer.text);
  const count = pages.count;
  const start = executePagination(interaction, pages, allStatistics.length);

  embed
    .setFields(await getAllMessagesFields(interaction, {start, count}, allStatistics))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter(t('discord:command.statistics.messages.completed.footer', {
      countStart: Math.min(start + 1, allStatistics.length),
      countFinish: Math.min(start + count, allStatistics.length),
      total: allStatistics.length,
      step: count,
    }));

  try {
    await interaction.update({embeds: [embed], components: [row]});
  } catch (e) {
    await notifyError('statistics', e, interaction);
  }
};

const voices = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_VOICES)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'statistics voices'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('statistics', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'statistics.voices'}),
    });
    return;
  }

  const allStatistics = await getAllStatistics();
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.voices.completed.title'))
    .setTimestamp()
    .setFields(await getAllVoicesFields(interaction, {start, count}, allStatistics))
    .setFooter(t('discord:command.statistics.voices.completed.footer', {
      countStart: Math.min(start + 1, allStatistics.length),
      countFinish: Math.min(start + count, allStatistics.length),
      total: allStatistics.length,
      step: count,
    }));

  const row = getPagination(start, count, allStatistics.length);

  try {
    await notify('statistics', interaction, {embeds: [embed], components: [row]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.statistics.voices'),
    });
  } catch (e) {
    await notifyError('statistics', e, interaction);
  }
};

const onVoices = async interaction => {
  const allStatistics = await getAllStatistics();
  const embed = interaction.message.embeds[0];
  const row = interaction.message.components[0];
  const pages = getPaginationPages(embed.footer.text);
  const count = pages.count;
  const start = executePagination(interaction, pages, allStatistics.length);

  embed
    .setFields(await getAllVoicesFields(interaction, {start, count}, allStatistics))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter(t('discord:command.statistics.voices.completed.footer', {
      countStart: Math.min(start + 1, allStatistics.length),
      countFinish: Math.min(start + count, allStatistics.length),
      total: allStatistics.length,
      step: count,
    }));

  try {
    await interaction.update({embeds: [embed], components: [row]});
  } catch (e) {
    await notifyError('statistics', e, interaction);
  }
};

const getAllSessionsFields = async (interaction, {start, count}, allSessions) => {
  const members = await interaction.guild.members.fetch();

  return allSessions
    .filter(session => session.guild_id === interaction.guildId)
    .sort((a, b) => a?.finish
      ? new Date(a.finish).getTime() - new Date(b.finish).getTime()
      : -1)
    .slice(start, start + count)
    .map(session => ({
      name: members.find(member => member.user.id === session.user_id).displayName ?? '<Unnamed>',
      value: `${session.begin.toLocaleString()} - ${session.finish?.toLocaleString() ?? t('common:player.beginNow')}`,
    }));
};

const getAllMessagesFields = async (interaction, {start, count}, allStatistics) => {
  const members = await interaction.guild.members.fetch();

  return allStatistics
    .sort((a, b) => b.message_count - a.message_count)
    .slice(start, start + count)
    .map(statistic => ({
      name: members.find(member => member.user.id === statistic.user_id)?.displayName ?? '<Unnamed>',
      value: statistic.message_count.toString(),
    }));
};

const getAllVoicesFields = async (interaction, {start, count}, allStatistics) => {
  const members = await interaction.guild.members.fetch();

  return allStatistics
    .sort((a, b) => comparePostgresInterval(a.voice_duration, b.voice_duration, true))
    .slice(start, start + count)
    .map(statistic => ({
      name: members.find(member => member.user.id === statistic.user_id)?.displayName ?? '<Unnamed>',
      value: localePostgresInterval(statistic.voice_duration),
    }));
};
