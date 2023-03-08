const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  'join', interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'Зашел к тебе в войс. Теперь ты сможешь погреться во всем моем великолепии и послушать музыку для ушей.\nКанал же Осенний кринж называется? О нем теперь будут слагать легенды',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Я зашел',
      }),
    ],
  }
];
