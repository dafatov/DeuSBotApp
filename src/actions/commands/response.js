const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {MessageActionRow, MessageButton, MessageEmbed} = require('discord.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyError} = require('../commands.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const db = require('../../db/repositories/responses.js');
const {escaping} = require('../../utils/string.js');
const {t} = require('i18next');

const {start, count} = {start: 0, count: 5};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('response')
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
  async execute(interaction) {
    await response(interaction);
  },
  async listener(interaction) {
    await onResponse(interaction);
  },
};

const response = async interaction => {
  if (interaction.options.getSubcommand() === 'set') {
    await set(interaction);
  } else if (interaction.options.getSubcommand() === 'remove') {
    await remove(interaction);
  } else if (interaction.options.getSubcommand() === 'show') {
    await show(interaction);
  }
};

const set = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_SET)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'response set'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'response.set'}),
    });
    return;
  }

  const {regex, react} = {
    regex: interaction.options.getString('regex'),
    react: interaction.options.getString('react'),
  };

  try {
    if (!regex || !react) {
      await notifyError('response', t('discord:command.response.set.emptyResponse', {regex, react}), interaction);
    }

    try {
      'test'.match(regex);
    } catch (e) {
      await notifyError('response', t('discord:command.response.set.wrongRegex', {regex}), interaction);
    }

    await db.set(interaction.guildId, {
      'regex': regex,
      'react': react,
    });
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.response.set.completed.title'))
      .setTimestamp()
      .addField(escaping(regex), react);

    await notify('response', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.response.set'),
    });
  } catch (e) {
    await notifyError('response', e, interaction);
  }
};

const remove = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'response remove'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'response.remove'}),
    });
    return;
  }

  const regex = interaction.options.getString('regex');

  try {
    if (!regex) {
      await notifyError('response', t('discord:command.response.remove.emptyRegex', {regex}), interaction);
    }

    await db.remove(interaction.guildId, regex);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(t('discord:command.response.remove.completed.title'))
      .setTimestamp()
      .setDescription(escaping(regex));

    await notify('response', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.response.removed'),
    });
  } catch (e) {
    await notifyError('response', e, interaction);
  }
};

const show = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_SHOW)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'response show'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'response.show'}),
    });
    return;
  }

  const rules = await db.getAll(interaction.guildId);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.response.show.completed.title'))
    .setFooter(t('discord:command.response.show.completed.footer', {
      countStart: Math.min(start + 1, rules.length),
      countFinish: Math.min(start + count, rules.length),
      total: rules.length,
      step: count,
    }));

  embed.setFields(rules
    .slice(start, count)
    .map(rule => ({
      name: escaping(rule.regex),
      value: rule.react,
    })),
  );

  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('first')
        .setLabel(t('common:player.first'))
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('previous')
        .setLabel(t('common:player.previous'))
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('update')
        .setLabel(t('common:player.update'))
        .setStyle('PRIMARY')
        .setDisabled(rules.length === 0),
      new MessageButton()
        .setCustomId('next')
        .setLabel(t('common:player.next'))
        .setStyle('PRIMARY')
        .setDisabled(start + count >= rules.length),
      new MessageButton()
        .setCustomId('last')
        .setLabel(t('common:player.last'))
        .setStyle('PRIMARY')
        .setDisabled(start + count >= rules.length),
    );

  try {
    await notify('response', interaction, {embeds: [embed], components: [row]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.response.showed'),
    });
  } catch (e) {
    await notifyError('response', e, interaction);
  }
};

const onResponse = async interaction => {
  const rules = await db.getAll(interaction.guildId);
  const embed = interaction.message.embeds[0];
  const row = interaction.message.components[0];
  const pages = calcPages(embed.footer.text);
  const count = pages.count;
  let start = pages.start;

  if (interaction.customId === 'next') {
    start += count;
  }
  if (interaction.customId === 'previous') {
    start -= count;
  }
  if (interaction.customId === 'update') {
    start = Math.min(start, rules.length - 1);
  }
  if (interaction.customId === 'first') {
    start = 0;
  }
  if (interaction.customId === 'last') {
    start = count * Math.floor(rules.length / count);
  }

  row.components.forEach(b => {
    if (b.customId === 'next') {
      b.setDisabled(start + count >= rules.length);
    }
    if (b.customId === 'previous') {
      b.setDisabled(start <= 0);
    }
    if (b.customId === 'update') {
      b.setDisabled(rules.length === 0);
    }
    if (b.customId === 'first') {
      b.setDisabled(start <= 0);
    }
    if (b.customId === 'last') {
      b.setDisabled(start + count >= rules.length);
    }
  });

  embed
    .setFields(rules
      .slice(start, start + count)
      .map(rule => ({
        name: escaping(rule.regex),
        value: rule.react,
      })))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter(t('discord:command.response.show.completed.footer', {
      countStart: Math.min(start + 1, rules.length),
      countFinish: Math.min(start + count, rules.length),
      total: rules.length,
      step: count,
    }));

  try {
    await interaction.update({embeds: [embed], components: [row]});
  } catch (e) {
    await notifyError('response', e, interaction);
  }
};

function calcPages(footer) {
  const array = footer.split(' ');
  return {start: array[0] - 1, count: parseInt(array[6])};
}
