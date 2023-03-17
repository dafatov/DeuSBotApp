const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'На данный момент сервером дискорда является... _*барабанная дробь типа*_\n...**deus-bot-news**',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Информационный канал сервера CRINGE-A-LOT',
      }),
    ],
  }
];
