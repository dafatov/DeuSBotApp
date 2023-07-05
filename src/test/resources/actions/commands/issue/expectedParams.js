const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/modalSubmitInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'sdadawdawdawda',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Заявка "ewerwerwew" создана',
        url: 'https://github.com/dafatov/DeusBot/issues/63'
      }),
    ],
  }
];
