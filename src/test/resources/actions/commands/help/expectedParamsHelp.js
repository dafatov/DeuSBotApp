const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'Команда позволяет вывести, как информацию по боту, так и по любой существующей команде.\n- Для вызова информации о боте надо использовать команду без аргументов\n- Для вызова информации о команде надо использовать команду с аргументом интересующей команды',
        footer: {
          'icon_url': 'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
          'text': 'Copyright (c) 2021-2023 dafatov',
        },
        title: 'Информация по **help**',
      }),
    ],
  },
];
