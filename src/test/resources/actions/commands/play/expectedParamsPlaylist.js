const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'Количество композиций: **2**\nДлительность: **00:09:05**\nМесто в очереди: **1**\nНачнется через: **<Сейчас>**',
        footer: {
          'icon_url': 'https://cdn.discordapp.com/avatars/348774809003491329/98e046c34d87c1b00cf6a9bf0f132959.webp',
          'text': 'Заказано DemetriouS',
        },
        thumbnail: {
          url: 'https://i.ytimg.com/vi/W6q1AWnjNiU/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLABzSNBM7sNMpky7jUqt-FgSqwuSQ',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'test',
        url: 'https://www.youtube.com/playlist?list=PLtcD_4Y3uPJNGDm-igZ5jYOmRI5XBABdn',
      }),
    ],
  },
];
