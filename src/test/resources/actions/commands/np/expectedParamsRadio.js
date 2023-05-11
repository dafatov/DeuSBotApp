const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: '\nИсточник: **artist**\nКомпозиция: **song**',
        'thumbnail': {
          'url': 'https://urlThumnail.com',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'title',
        url: 'https://url.com',
      }),
    ],
    files: [
      [32, 43, 11, 55],
    ],
  },
];
