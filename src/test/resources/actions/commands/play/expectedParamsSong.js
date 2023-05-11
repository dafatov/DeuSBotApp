const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'Количество композиций: **1**\nДлительность: **00:04:52**\nМесто в очереди: **1**\nНачнется через: **<Сейчас>**',
        thumbnail: {
          url: 'https://i.ytimg.com/vi/W6q1AWnjNiU/hqdefault.jpg?sqp=-oaymwEbCKgBEF5IVfKriqkDDggBFQAAiEIYAXABwAEG&rs=AOn4CLCEKrV5_x_DMMa9UdvogLuVqZBXPA',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Spice and Wolf OP 1 FULL (with lyrics)',
        url: 'https://www.youtube.com/watch?v=W6q1AWnjNiU',
      }),
    ],
  },
];
