const {MessageEmbed} = require('discord.js');

module.exports = {
  embeds: [
    new MessageEmbed({
      color: 16777040,
      timestamp: new Date('2023-02-06T10:20:27.013Z'),
      description: 'Количество композиций: **2**\nДлительность: **01:31:23**\nМесто в очереди: **1**\nНачнется через: **<Сейчас>**',
      footer: {
        'icon_url': 'https://cdn.discordapp.com/avatars/348774809003491329/98e046c34d87c1b00cf6a9bf0f132959.webp',
        'text': 'Плейлист создал DemetriouS',
      },
      'thumbnail': {
        'url': 'https://i.ibb.co/PGFbnkS/Afk-W8-Fi-E-400x400.png',
      },
      title: 'Композиции профиля login',
      'url': 'https://shikimori.me/login/list/anime/mylist/completed,watching/order-by/ranked',
    }),
  ],
};
