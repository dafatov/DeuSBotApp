const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'Решал на досуге задачи тысячелетия и решил за 123мс. Их все.',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Мое время обработки данных',
      }),
    ],
  }
];
