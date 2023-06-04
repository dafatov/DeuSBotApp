const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    components: [],
    embeds: [
      new EmbedBuilder({
        color: 16746496,
        description: 'Список резервных копий для таблицы "response" абсолютно пуст и это не подвержено сомнениям',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Неловко вышло...',
      }),
    ],
  },
];
