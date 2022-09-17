const config = require('../../configs/config.js');
const {logGuild} = require('../../utils/logger.js');
const db = require('../../db/repositories/responses.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const {notify, notifyError} = require('../commands.js');
const {escaping} = require('../../utils/string.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

const {start, count} = {start: 0, count: 5};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('response')
    .setDescription('Манипулирование реакциями')
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Добавление или изменение реакции')
      .addStringOption(o => o
        .setName('regex')
        .setDescription('Шаблон, определяющий на какое сообщение реагировать')
        .setRequired(true))
      .addStringOption(o => o
        .setName('react')
        .setDescription('Текст реакции')
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Удаление существующей реакции. Может удалять то, чего нет')
      .addStringOption(o => o
        .setName('regex')
        .setDescription('Шаблон, определяющий на какое сообщение реагировать')
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('show')
      .setDescription('Отображение существующий реакций в виде списка')),
  async execute(interaction) {
    await response(interaction);
  },
  async listener(interaction) {
    await onResponse(interaction);
  },
};

const response = async (interaction) => {
  if (interaction.options.getSubcommand() === 'set') {
    await set(interaction);
  } else if (interaction.options.getSubcommand() === 'remove') {
    await remove(interaction);
  } else if (interaction.options.getSubcommand() === 'show') {
    await show(interaction);
  }
};

const set = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_SET)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"response set\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде response.set запрещен',
    });
    return;
  }

  let {regex, react} = {
    regex: interaction.options.getString('regex'),
    react: interaction.options.getString('react'),
  };

  try {
    if (!regex || !react) {
      await notifyError('response', `Regex or react is undefined: [regex: "${regex}", react: "${react}"]`, interaction);
    }

    try {
      'test'.match(regex);
    } catch (e) {
      await notifyError('response', `Некорректное регулярное выражение: ${regex}`, interaction);
    }

    await db.set(interaction.guildId, {
      'regex': regex,
      'react': react,
    });
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Я создал реакцию')
      .setTimestamp()
      .addField(escaping(regex), react);

    await notify('response', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[response]: Реакция успешно добавлена`);
  } catch (e) {
    await notifyError('response', e, interaction);
  }
};

const remove = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"response remove\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде response.remove запрещен',
    });
    return;
  }

  let regex = interaction.options.getString('regex');

  try {
    if (!regex) {
      await notifyError('response', `Regex is undefined: [regex: "${regex}"]`, interaction);
    }

    await db.remove(interaction.guildId, regex);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Я уничтожил реакцию')
      .setTimestamp()
      .setDescription(escaping(regex));

    await notify('response', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[response]: Реакция успешно удалена`);
  } catch (e) {
    await notifyError('response', e, interaction);
  }
};

const show = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RESPONSE_SHOW)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"response show\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('response', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде response.show запрещен',
    });
    return;
  }

  const rules = await db.getAll(interaction.guildId);
  const embed = new MessageEmbed()
    .setColor('#000000')
    .setTitle('Все реакции на текущий момент')
    .setFooter(`${Math.min(start + 1, rules.length)} - ${Math.min(start + count, rules.length)} из ${rules.length} по ${count}`);

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
        .setLabel('|<')
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('previous')
        .setLabel('<')
        .setStyle('PRIMARY')
        .setDisabled(start <= 0),
      new MessageButton()
        .setCustomId('update')
        .setLabel('Обновить')
        .setStyle('PRIMARY')
        .setDisabled(rules.length === 0),
      new MessageButton()
        .setCustomId('next')
        .setLabel('>')
        .setStyle('PRIMARY')
        .setDisabled(start + count >= rules.length),
      new MessageButton()
        .setCustomId('last')
        .setLabel('>|')
        .setStyle('PRIMARY')
        .setDisabled(start + count >= rules.length),
    );

  try {
    await notify('response', interaction, {embeds: [embed], components: [row]});
    logGuild(interaction.guildId, `[response]: Список реакций успешно выведен`);
  } catch (e) {
    await notifyError('response', e, interaction);
  }
};

const onResponse = async (interaction) => {
  const rules = await db.getAll(interaction.guildId);
  let embed = interaction.message.embeds[0];
  let row = interaction.message.components[0];
  let {start, count} = calcPages(embed.footer.text);

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

  embed.setFields(rules
      .slice(start, start + count)
      .map(rule => ({
        name: escaping(rule.regex),
        value: rule.react,
      })))
    //Данные количества на странице (count) берутся из footer'а. Да, костыль
    .setFooter(`${start + 1} - ${Math.min(start + count, rules.length)} из ${rules.length} по ${count}`);

  try {
    await interaction.update({embeds: [embed], components: [row]});
  } catch (e) {
    await notifyError('response', e, interaction);
  }
};

function calcPages(footer) {
  let array = footer.split(' ');
  return {start: array[0] - 1, count: parseInt(array[6])};
}
