const {SlashCommandBuilder} = require('@discordjs/builders');
const {move} = require('./move.js');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('first')
    .setDescription(t('discord:command.first.description'))
    .addIntegerOption(o => o
      .setName('target')
      .setDescription(t('discord:command.first.option.target.description'))
      .setRequired(true)),
  async execute(interaction) {
    await first(interaction);
  },
};

const first = async interaction => {
  interaction.commandName = 'move';
  await move(interaction, true, 0);
};
