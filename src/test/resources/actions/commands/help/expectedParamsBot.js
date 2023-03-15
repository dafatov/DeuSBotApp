const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  'help', interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'Данный бот (Deus v1.6.0) был разработан DemetriouS (aka dafatov) в рамках частного проекта специально для дискорд сервера на чистом энтузиазме\n\nСайт бота: https://discord-bot-deus-web.onrender.com/',
        footer: {
          'icon_url': 'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
          'text': 'Copyright (c) 2021-2023 dafatov',
        },
        title: 'Информация по **боту Deus**',
      }),
    ],
  },
];
