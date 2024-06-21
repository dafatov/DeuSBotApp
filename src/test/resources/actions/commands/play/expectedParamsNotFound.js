const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16746496,
        description: 'По данному запросу ничего не найдено',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Душный запрос',
      }),
    ],
  },
];
