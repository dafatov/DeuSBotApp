const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {comparePostgresInterval, localePostgresInterval} = require('../../utils/dateTime');
const {notify, notifyForbidden} = require('../commands');
const {Pagination} = require('../../utils/components');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {getAll: getAllSessions} = require('../../db/repositories/session');
const {getAll: getAllStatistics} = require('../../db/repositories/statistics');
const {getCommandName} = require('../../utils/string');
const {t} = require('i18next');

const {start, count} = {start: 0, count: 5};

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
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
  execute: interaction => statistics(interaction),
  onButton: interaction => onStatistics(interaction),
};

const statistics = interaction => {
  switch (interaction.options.getSubcommand()) {
    case 'session':
      return session(interaction);
    case 'messages':
      return messages(interaction);
    case 'voices':
      return voices(interaction);
  }
};

const onStatistics = interaction => {
  switch (interaction.message.interaction.commandName.split(' ')[1]) {
    case 'session':
      return onSession(interaction);
    case 'messages':
      return onMessages(interaction);
    case 'voices':
      return onVoices(interaction);
  }
};

const session = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_SESSION)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const sessions = await getSessions(interaction.guildId);
  const pagination = Pagination.getComponent(start, count, sessions.length);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.session.completed.title'))
    .setDescription(getSessionsDescription(sessions, start, count))
    .setTimestamp()
    .setFooter({text: Pagination.getFooter(start, count, sessions.length)});
  await notify(interaction, {embeds: [embed], components: [pagination]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.statistics.session'),
  });
};

const onSession = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_SESSION)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const sessions = await getSessions(interaction.guildId);
  const embed = EmbedBuilder.from(interaction.message.embeds[0]);
  const pages = Pagination.getPages(embed);
  const {start, pagination} = Pagination.update(interaction, pages, sessions.length);

  embed
    .setDescription(getSessionsDescription(sessions, start, pages.count))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, sessions.length)});

  await interaction.update({embeds: [embed], components: [pagination]});
};

const messages = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_MESSAGES)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const messages = await getMessages(interaction.guildId);
  const pagination = Pagination.getComponent(start, count, messages.length);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.messages.completed.title'))
    .setDescription(getMessagesDescription(messages, start, count))
    .setTimestamp()
    .setFooter({text: Pagination.getFooter(start, count, messages.length)});
  await notify(interaction, {embeds: [embed], components: [pagination]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.statistics.messages'),
  });
};

const onMessages = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_MESSAGES)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const messages = await getMessages(interaction.guildId);
  const embed = EmbedBuilder.from(interaction.message.embeds[0]);
  const pages = Pagination.getPages(embed);
  const {start, pagination} = Pagination.update(interaction, pages, messages.length);

  embed
    .setDescription(getMessagesDescription(messages, start, pages.count))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, messages.length)});

  await interaction.update({embeds: [embed], components: [pagination]});
};

const voices = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_VOICES)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const voices = await getVoices(interaction.guildId);
  const pagination = Pagination.getComponent(start, count, voices.length);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.voices.completed.title'))
    .setDescription(getVoicesDescription(voices, start, count))
    .setTimestamp()
    .setFooter({text: Pagination.getFooter(start, count, voices.length)});
  await notify(interaction, {embeds: [embed], components: [pagination]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.statistics.voices'),
  });
};

const onVoices = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_STATISTICS_VOICES)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const voices = await getVoices(interaction.guildId);
  const embed = EmbedBuilder.from(interaction.message.embeds[0]);
  const pages = Pagination.getPages(embed);
  const {start, pagination} = Pagination.update(interaction, pages, voices.length);

  embed
    .setDescription(getVoicesDescription(voices, start, pages.count))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, voices.length)});

  await interaction.update({embeds: [embed], components: [pagination]});
};

const getSessions = guildId => getAllSessions()
  .then(sessions => sessions
    .filter(session => session.guild_id === guildId)
    .sort((a, b) => {
      if (a?.finish && b?.finish) {
        return new Date(b.finish)?.getTime() - new Date(a.finish)?.getTime();
      } else if (a?.finish && !b?.finish) {
        return 1;
      } else if (!a?.finish && b?.finish) {
        return -1;
      } else {
        return new Date(b.begin).getTime() - new Date(a.begin).getTime();
      }
    }));

const getSessionsDescription = (sessions, start, count) => sessions
  .slice(start, start + count)
  .map(session => `<@${session.user_id}>\n${getSessionValue(session)}`)
  .join('\n\n');

const getSessionValue = session =>
  `<t:${Math.floor(session.begin.getTime() / 1000)}>\n${session.finish
    ? `<t:${Math.floor(session.finish / 1000)}>\n\`${localePostgresInterval(session.duration)}\``
    : `\`${t('common:player.beginNow')}\``}`;

const getMessages = guildId => getAllStatistics()
  .then(statistics => statistics
    .filter(statistic => statistic.guild_id === guildId)
    .map(statistic => ({userId: statistic.user_id, messageCount: statistic.message_count}))
    .sort((a, b) => b.messageCount - a.messageCount));

const getMessagesDescription = (messages, start, count) => messages
  .slice(start, start + count)
  .map(message => `<@${message.userId}>\n${message.messageCount.toString()}`)
  .join('\n\n');

const getVoices = guildId => getAllStatistics()
  .then(statistics => statistics
    .filter(statistic => statistic.guild_id === guildId)
    .map(statistic => ({userId: statistic.user_id, voiceDuration: statistic.voice_duration}))
    .sort((a, b) => comparePostgresInterval(a.voiceDuration, b.voiceDuration, true)));

const getVoicesDescription = (voices, start, count) => voices
  .slice(start, start + count)
  .map(voice => `<@${voice.userId}>\n${localePostgresInterval(voice.voiceDuration)}`)
  .join('\n\n');
