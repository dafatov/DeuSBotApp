const {ActionRowBuilder, EmbedBuilder} = require('discord.js');

module.exports = [
  {
    components: [
      new ActionRowBuilder({
        components: [
          {
            custom_id: 'first-1',
            disabled: true,
            label: 'В начало очереди',
            style: 1,
            type: 2,
          },
        ],
        type: 1,
      }),
    ],
  },
  {
    embeds: [
      new EmbedBuilder({
        color: 16746496,
        description: 'Ты видимо не в ту дырку долбился раз не видишь: **нет данной композиции в очереди**',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Следи за руками',
      }),
    ],
  },
];
