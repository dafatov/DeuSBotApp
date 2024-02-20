const {EmbedBuilder} = require('discord.js');

module.exports = [
  {
    components: [],
    embeds: [
      new EmbedBuilder({
        color: 16777040,
        description: '_Ниже представлены результаты с количеством голосов за каждый вариант_',
        fields: [
          {
            name: 'optionButton_0',
            value: '◼◼◼◼◼◼◼◼◼◼◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻ [1, 33%]\n@<381845173384249356>',
          },
          {
            name: 'optionButton_1',
            value: '◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◼◻◻◻◻◻◻◻◻◻◻ [2, 66%]\n@<348774809003491329>@<233923369685352449>',
          },
          {
            name: 'optionButton_2',
            value: '◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻◻ [0, 0%]\n',
          },
        ],
        timestamp: '2023-02-06T10:20:27.013Z',
        title: 'Опрос "title" закончен (3 голоса)',
      }),
    ],
  }, 'time',
];
