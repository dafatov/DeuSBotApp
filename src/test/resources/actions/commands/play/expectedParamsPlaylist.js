const {ActionRowBuilder, EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    components: [
      new ActionRowBuilder({
        components: [
          {
            custom_id: 'first-1',
            disabled: true,
            label: 'В начало очереди',
            style: 1,
            type: 2,
          },
        ],
        type: 1,
      }),
    ],
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'Количество композиций: **2**\nДлительность: **00:09:05**\nМесто в очереди: **1**\nНачнется через: **<Сейчас>**',
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
