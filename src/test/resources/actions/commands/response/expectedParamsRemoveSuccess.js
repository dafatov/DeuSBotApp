const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'regex',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Я уничтожил реакцию',
      }),
    ],
  },
];
