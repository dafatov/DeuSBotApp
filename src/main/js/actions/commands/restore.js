const {ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require('discord.js');
const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {notify, notifyForbidden} = require('../commands');
const {DISCORD_OPTIONS_MAX} = require('../../utils/constants');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const fs = require('fs');
const {getAll} = require('../../db/repositories/snapshots');
const {getCommandName} = require('../../utils/string');
const {restore: restoreDb} = require('../../db/repositories/snapshots');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName(getCommandName(__filename))
    .setDescription(t('discord:command.restore.description'))
    .addStringOption(o => o
      .setName('table')
      .setDescription(t('discord:command.restore.option.table.description'))
      .setRequired(true)
      .setChoices(...fs.readdirSync('./src/main/js/db/repositories')
        .filter(fileName => fileName.endsWith('.js'))
        .map(fileName => fileName.split('.')[0])
        .filter(fileName => JSON.parse(process.env.RESTORABLE_TABLES ?? '[]').includes(fileName))
        .map(table => ({name: table, value: table})))),
  execute: interaction => restore(interaction),
  onSelect: interaction => onSelect(interaction),
};

const restore = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESTORE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const tableValue = interaction.options.getString('table');
  const dataPromise = getAll()
    .then(snapshots => snapshots
      .filter(({table}) => table === tableValue)
      .filter(({guildId}) => !guildId || guildId === interaction.guildId)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-DISCORD_OPTIONS_MAX));

  if ((await dataPromise).length <= 0) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(t('discord:command.restore.noData.title'))
      .setDescription(t(
        'discord:command.restore.noData.description',
        {table: tableValue},
      ))
      .setTimestamp();
    await notify(interaction, {embeds: [embed], components: []});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.restore.noData'),
    });
    return;
  }

  const row = await dataPromise
    .then(snapshots => snapshots.map(({id, date}) => new StringSelectMenuOptionBuilder()
      .setLabel(`${date.toLocaleString('ru-RU')} GMT`)
      .setValue(id)))
    .then(options => new StringSelectMenuBuilder()
      .setCustomId('select')
      .setPlaceholder(t('discord:command.restore.select.placeholder'))
      .addOptions(...options))
    .then(select => new ActionRowBuilder()
      .setComponents(select));

  await notify(interaction, {components: [row]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.restore.execute'),
  });
};

const onSelect = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESTORE)) {
    await notifyForbidden(getCommandName(__filename), interaction);
    return;
  }

  const {table, date} = await restoreDb(interaction.values[0]);

  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.restore.completed.title'))
    .setDescription(t(
      'discord:command.restore.completed.description',
      {table, timestamp: Math.floor(date.getTime() / 1000)},
    ))
    .setTimestamp();
  await interaction.update({embeds: [embed], components: []});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.restore.select', {table}),
  });
};
