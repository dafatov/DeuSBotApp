const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16777040,
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        description: 'Выбраны аниме, песни и формируется плейлист. **Слышь, подожди!**',
        title: 'Плейлист формируется',
      }),
    ],
  },
];
