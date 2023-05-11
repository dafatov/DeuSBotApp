const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'Композиция **title 2** была стерта из реальности очереди',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Целевая композиция дезинтегрирована',
      }),
    ],
  }
];
