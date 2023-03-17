const {MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new MessageEmbed({
        color: 16746496,
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        description: 'В связи с настойчивыми требованиями некоторых сущностей рандом реализован через random.org, но в связи с этим существует ограничение на количество запросов в 10000 в месяц. Хз как, но лимит исчерпан, так что терпим терпилы или донатим))',
        title: 'Рандома не осталось',
      }),
    ],
  },
];
