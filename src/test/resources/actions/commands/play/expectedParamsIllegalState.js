const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16746496,
        description: 'Обратитесь к администратору для выяснения обстоятельств',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Некорректное состояние команды "play"',
      }),
    ],
  },
];
