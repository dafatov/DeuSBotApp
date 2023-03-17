const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'Ох.. Эти времена, эти нравы.. Кто-то созидает, а кто-то может только уничтожать.\nПоздравляю разрушитель, у тебя получилось. **Плейлист очищен**',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Э-эм. а где все?',
      }),
    ],
  }
];
