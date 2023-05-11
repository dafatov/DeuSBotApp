const {SlashCommandBuilder} = require('discord.js');
const {move} = require('./move');
const {t} = require('i18next');

module.exports = {
  data: () => new SlashCommandBuilder()
    .setName('first')
    .setDescription(t('discord:command.first.description'))
    .addIntegerOption(o => o
      .setName('target')
      .setDescription(t('discord:command.first.option.target.description'))
      .setRequired(true)),
  execute: interaction => move(interaction, true, 0)
};
