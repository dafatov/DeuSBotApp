const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  'help', interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'Команда позволяет вывести, как информацию по боту, так и по любой существующей команде',
        footer: {
          'icon_url': 'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
          'text': 'Copyright (c) 2021-2023 dafatov',
        },
        title: 'Информация по **help**',
      }),
    ],
  },
];
