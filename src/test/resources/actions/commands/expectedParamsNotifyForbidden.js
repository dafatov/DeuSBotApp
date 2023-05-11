const {EmbedBuilder} = require('discord.js');
const interaction = require('../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16746496,
        description: 'Запросите доступ у администратора сервера',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Доступ к команде "test" запрещен',
      }),
    ],
    ephemeral: true,
  },
];
