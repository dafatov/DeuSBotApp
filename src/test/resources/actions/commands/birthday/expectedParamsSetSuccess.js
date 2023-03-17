const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'К качестве даты дня рождения установлен: **13.06.2000**',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Жди поздравлений...',
      }),
    ],
  }
];
