const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {comparePostgresInterval, localePostgresInterval} = require('../../utils/dateTime');
const {notify, notifyError} = require('../commands');
const {MessageEmbed} = require('discord.js');
const {Pagination} = require('../../utils/components');
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

  const sessions = await getSessions(interaction.guildId);
  const pagination = Pagination.getComponent(start, count, sessions.length);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.session.completed.title'))
    .setDescription(getSessionsDescription(sessions, start, count))
    .setTimestamp()
    .setFooter({text: Pagination.getFooter(start, count, sessions.length)});

  try {
    await notify('statistics', interaction, {embeds: [embed], components: [pagination]});
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
  const sessions = await getSessions(interaction.guildId);
  const embed = interaction.message.embeds[0];
  const pagination = interaction.message.components[0];
  const pages = Pagination.getPages(embed.footer.text);
  const start = Pagination.update(interaction, pages, sessions.length);

  embed
    .setDescription(getSessionsDescription(sessions, start, pages.count))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, sessions.length)});

  try {
    await interaction.update({embeds: [embed], components: [pagination]});
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

  const messages = await getMessages(interaction.guildId);
  const pagination = Pagination.getComponent(start, count, messages.length);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.messages.completed.title'))
    .setDescription(getMessagesDescription(messages, start, count))
    .setTimestamp()
    .setFooter({text: Pagination.getFooter(start, count, messages.length)});

  try {
    await notify('statistics', interaction, {embeds: [embed], components: [pagination]});
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
  const messages = await getMessages(interaction.guildId);
  const embed = interaction.message.embeds[0];
  const pagination = interaction.message.components[0];
  const pages = Pagination.getPages(embed.footer.text);
  const start = Pagination.update(interaction, pages, messages.length);

  embed
    .setDescription(getMessagesDescription(messages, start, pages.count))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, messages.length)});

  try {
    await interaction.update({embeds: [embed], components: [pagination]});
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

  const voices = await getVoices(interaction.guildId);
  const pagination = Pagination.getComponent(start, count, voices.length);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.statistics.voices.completed.title'))
    .setDescription(getVoicesDescription(voices, start, count))
    .setTimestamp()
    .setFooter({text: Pagination.getFooter(start, count, voices.length)});

  try {
    await notify('statistics', interaction, {embeds: [embed], components: [pagination]});
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
  const voices = await getVoices(interaction.guildId);
  const embed = interaction.message.embeds[0];
  const pagination = interaction.message.components[0];
  const pages = Pagination.getPages(embed.footer.text);
  const start = Pagination.update(interaction, pages, voices.length);

  embed
    .setDescription(getVoicesDescription(voices, start, pages.count))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, voices.length)});

  try {
    await interaction.update({embeds: [embed], components: [pagination]});
  } catch (e) {
    await notifyError('statistics', e, interaction);
  }
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
