const {SlashCommandBuilder} = require('@discordjs/builders');
const db = require('../../db/repositories/publicist.js');
const {MessageEmbed} = require('discord.js');
const config = require('../../configs/config');
const {notify, notifyError} = require('../commands');
const {logGuild} = require('../../utils/logger');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('publicist')
    .setDescription('Манипулирование новостным информатором')
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Добавление или изменение информационного канала')
      .addChannelOption(c => c
        .setName('channel')
        .setDescription('Канал, именуемый информационным')
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Удаление информационного канала'))
    .addSubcommand(s => s
      .setName('show')
      .setDescription('Отображение текущего информационного канала')),
  async execute(interaction) {
    await publicist(interaction);
  },
  async listener(_interaction) {},
}

const publicist = async (interaction) => {
  if (interaction.options.getSubcommand() === 'set') {
    await set(interaction);
  } else if (interaction.options.getSubcommand() === 'remove') {
    await remove(interaction);
  } else if (interaction.options.getSubcommand() === 'show') {
    await show(interaction);
  }
}

const set = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_SET)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"publicist set\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('publicist', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде publicist.set запрещен',
    });
    return;
  }

  const channel = interaction.options.getChannel('channel');

  try {
    await db.set(interaction.guildId, channel.id);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Хех.. ой щас заспамлю')
      .setDescription(`В качестве информационного канала установлен канал **${channel.name}**`)
      .setTimestamp();
    await notify('publicist', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[publicist]: Информационный канал успешно установлен`);
  } catch (e) {
    await notifyError('publicist', e, interaction);
  }
}

const remove = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_REMOVE)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"publicist remove\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('publicist', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде publicist.remove запрещен',
    });
    return;
  }

  try {
    await db.remove(interaction.guildId);
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Ты чо меня заскамил? Чтоб я больше не спамил Йоу')
      .setDescription('Информационный канал удален. Deus больше не сможет посылать уведомления')
      .setTimestamp();
    await notify('publicist', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[publicist]: Информационный канал успешно удален`);
  } catch (e) {
    await notifyError('publicist', e, interaction);
  }
};

const show = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PUBLICIST_SHOW)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"publicist show\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('publicist', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде publicist.show запрещен',
    });
    return;
  }

  try {
    const channelId = (await db.getAll()).find(p => p.guildId === interaction.guildId)?.channelId;
    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle(`Информационный канал сервера ${interaction.guild.name}`)
      .setDescription(`На данный момент сервером дискорда является... _\*барабанная дробь типа\*_
        ...**${interaction.guild.channels.cache.get(channelId)?.name}**`)
      .setTimestamp();
    await notify('publicist', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[publicist]: Информационный канал успешно выведен`);
  } catch (e) {
    await notifyError('publicist', e, interaction);
  }
};
