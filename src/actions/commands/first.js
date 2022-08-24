const {SlashCommandBuilder} = require('@discordjs/builders');
const {move} = require('./move.js');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {MessageEmbed} = require('discord.js');
const config = require('../../configs/config');
const {notify} = require('../commands');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('first')
    .setDescription('Переместить композицию с места в очереди на первую')
    .addIntegerOption(o => o
      .setName('target')
      .setDescription('Номер в очереди целевой композиции')
      .setRequired(true)),
  async execute(interaction) {
    await first(interaction);
  },
  async listener(_interaction) {},
}

const first = async (interaction) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_FIRST)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"first\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('first', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде first запрещен',
    });
    return {result: 'Доступ к команде запрещен'};
  }

  interaction.commandName = 'move';
  await move(interaction, true, 0);
}
