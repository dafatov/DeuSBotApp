const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  'shikimori', interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        description: 'Логина "login" не существует в системе shikimori',
        title: 'Берега попутаны.. Японские берега',
      }),
    ],
  },
];
