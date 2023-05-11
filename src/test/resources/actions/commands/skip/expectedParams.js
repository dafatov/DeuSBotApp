const {EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: 'Название того, что играло уже не помню. Прошлое должно остаться в прошлом.\n...Вроде это **Пример наименования песни**, но уже какая разница?',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Текущая композиция уничтожена',
      }),
    ],
  }
];
