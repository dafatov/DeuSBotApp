const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'Количество композиций: **1**\nДлительность: **00:01:40**\nМесто в очереди: **1**\nНачнется через: **<Сейчас>**',
        thumbnail: {
          url: 'https://i.imgur.com/7SdVZxF.png',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'https://www.host.com',
        url: 'https://www.host.com',
      }),
    ],
  },
];
