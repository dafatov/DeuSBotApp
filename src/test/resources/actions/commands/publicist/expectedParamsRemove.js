const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: 'Информационный канал удален. Deus больше не сможет посылать уведомления',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Ты чо меня заскамил? Чтоб я больше не спамил Йоу',
      }),
    ],
  }
];
