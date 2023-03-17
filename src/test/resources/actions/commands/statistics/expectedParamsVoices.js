const {MessageActionRow, MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    components: [
      new MessageActionRow({
        components: [
          {
            custom_id: 'first',
            disabled: true,
            label: '|<',
            style: 1,
            type: 2,
          },
          {
            custom_id: 'previous',
            disabled: true,
            label: '<',
            style: 1,
            type: 2,
          },
          {
            custom_id: 'update',
            disabled: false,
            label: 'Обновить',
            style: 1,
            type: 2,
          },
          {
            custom_id: 'next',
            disabled: false,
            label: '>',
            style: 1,
            type: 2,
          },
          {
            custom_id: 'last',
            disabled: false,
            label: '>|',
            style: 1,
            type: 2,
          },
        ],
        type: 1,
      }),
    ],
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: '<@381845173384249356>\n13 дней 21 час 51 минута 32 секунды 736 миллисекунд\n\n<@229605426327584769>\n5 дней 3 часа 44 минуты 22 секунды 65 миллисекунд\n\n<@217196050337890305>\n2 дня 5 часов 49 минут 44 секунды 310 миллисекунд\n\n<@395615758278852609>\n2 дня 24 минуты 33 секунды 414 миллисекунд\n\n<@233923369685352449>\n1 день 12 часов 25 минут 4 секунды 689 миллисекунд',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Время, проведенное в голосовых каналах',
        footer: {
          text: '1 - 5 из 12 по 5',
        },
      }),
    ],
  },
];
