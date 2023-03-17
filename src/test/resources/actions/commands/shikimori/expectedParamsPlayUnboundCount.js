const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16746496,
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        description: 'Ну ты и клоун, конечно...\n_В связи с ограничением серверов youtube максимальное количество меньше 100_',
        title: 'Некорректное значения количества композиций',
      }),
    ],
  },
];
