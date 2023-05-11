const {EmbedBuilder} = require('discord.js');
const interaction = require('../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16746496,
        description: 'Зациклить то, что и так играет 24/7. Ты мой работодатель? Сорян, но не выйдет, а выйдет - уволюсь',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Живая музыка',
      }),
    ],
  },
];
