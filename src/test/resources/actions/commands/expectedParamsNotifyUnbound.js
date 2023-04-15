const {MessageEmbed} = require('discord.js');
const interaction = require('../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16746496,
        description: 'Типа знаешь вселенная расширяется, а твой мозг походу нет. Ну вышел ты за пределы размеров очереди.\nДиапазон значений _от 1 до 2_',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Ты это.. Вселенной ошибся, чел.',
      }),
    ],
  },
];
