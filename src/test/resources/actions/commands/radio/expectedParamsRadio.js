const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    'embeds': [
      new MessageEmbed({
        'author': null,
        'color': 16777040,
        'description': 'Количество композиций: **1**\nДлительность: **<Стрим>**\nМесто в очереди: **1**\nНачнется через: **<Сейчас>**',
        'fields': [],
        'footer': {
          'icon_url': 'https://cdn.discordapp.com/avatars/348774809003491329/98e046c34d87c1b00cf6a9bf0f132959.webp',
          'text': 'Радиостанцию добавил пользователь DemetriouS',
        },
        'image': null,
        'thumbnail': {'url': 'preview'},
        'timestamp': new Date('2023-02-06T10:20:27.013Z'),
        'title': 'stationKey',
        'type': 'rich',
        'url': 'url',
      }),
    ],
  },
];
