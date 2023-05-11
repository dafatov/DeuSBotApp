const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'Количество композиций: **1**\nДлительность: **00:01:30**\nМесто в очереди: **1**\nНачнется через: **<Сейчас>**',
        thumbnail: {
          url: 'https://i.ytimg.com/vi/MN_WgwEmRaw/hqdefault.jpg?sqp=-oaymwEbCKgBEF5IVfKriqkDDggBFQAAiEIYAXABwAEG&rs=AOn4CLA1_Wxd5yspStVsfezq9wRoCXAGzA',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Spice and Wolf OP ( IN HD!! )',
        url: 'https://www.youtube.com/watch?v=MN_WgwEmRaw',
      }),
    ],
  },
];
