const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {EmbedBuilder, SlashCommandBuilder} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {escaping, getCommandName, stringify} = require('../../utils/string');
const {notify, notifyForbidden} = require('../commands');
const {Pagination} = require('../../utils/components');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const db = require('../../db/repositories/response');
const {t} = require('i18next');

const {start, count} = {start: 0, count: 5};

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.response.description'))
    .addSubcommand(s => s
      .setName('set')
      .setDescription(t('discord:command.response.set.description'))
      .addStringOption(o => o
        .setName('regex')
        .setDescription(t('discord:command.response.set.option.regex.description'))
        .setRequired(true))
      .addStringOption(o => o
        .setName('react')
        .setDescription(t('discord:command.response.set.option.react.description'))
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription(t('discord:command.response.remove.description'))
      .addStringOption(o => o
        .setName('regex')
        .setDescription(t('discord:command.response.remove.option.regex.description'))
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('show')
      .setDescription(t('discord:command.response.show.description'))),
  execute: interaction => response(interaction),
  onButton: interaction => onShow(interaction),
};

const response = interaction => {
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
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_SET)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const response = {
    regex: interaction.options.getString('regex'),
    react: interaction.options.getString('react'),
  };

  try {
    'test'.match(response.regex);
  } catch (e) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(t('discord:command.response.set.wrongRegex.title'))
      .setTimestamp()
      .setDescription(t('discord:command.response.set.wrongRegex.description', {regex: response.regex}));
    await notify(interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: stringify(e),
    });
    return;
  }

  await db.set(interaction.guildId, response);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.response.set.completed.title'))
    .setTimestamp()
    .setFields({name: escaping(response.regex), value: response.react});
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.response.set'),
  });
};

const remove = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_REMOVE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const regex = interaction.options.getString('regex');

  await db.remove(interaction.guildId, regex);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.response.remove.completed.title'))
    .setTimestamp()
    .setDescription(escaping(regex));
  await notify(interaction, {embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.response.removed'),
  });
};

const show = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_SHOW)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const rules = await db.getAll(interaction.guildId);
  const pagination = Pagination.getComponent(start, count, rules.length);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.response.show.completed.title'))
    .setTimestamp()
    .setFields(getRulesFields(rules, start, count))
    .setFooter({text: Pagination.getFooter(start, count, rules.length)});
  await notify(interaction, {embeds: [embed], components: [pagination]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.response.showed'),
  });
};

const onShow = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_SHOW)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const rules = await db.getAll(interaction.guildId);
  const embed = EmbedBuilder.from(interaction.message.embeds[0]);
  const pages = Pagination.getPages(embed);
  const {start, pagination} = Pagination.update(interaction, pages, rules.length);

  embed
    .setFields(getRulesFields(rules, start, count))
    .setTimestamp()
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter({text: Pagination.getFooter(start, pages.count, rules.length)});
  await interaction.update({embeds: [embed], components: [pagination]});
};

const getRulesFields = (rules, start, count) => rules
  .slice(start, start + count)
  .map(rule => ({
    name: escaping(rule.regex),
    value: rule.react,
  }));
