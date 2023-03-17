const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'Количество композиций: **1**\nДлительность: **00:04:52**\nМесто в очереди: **1**\nНачнется через: **<Сейчас>**',
        footer: {
          'icon_url': 'https://cdn.discordapp.com/avatars/348774809003491329/98e046c34d87c1b00cf6a9bf0f132959.webp',
          'text': 'Заказано DemetriouS',
        },
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
