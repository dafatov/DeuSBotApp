const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: '...решил НЕ игнорировать все напоминания о дате рождения',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Пользователь DemetriouS...',
      }),
    ],
  }
];
