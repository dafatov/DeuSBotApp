const {ActionRowBuilder, EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    components: [
      new ActionRowBuilder({
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
      new EmbedBuilder({
        color: 16777040,
        description: '<@217196050337890305>\n66\n\n<@345503614359568384>\n11\n\n<@155149108183695360>\n9\n\n<@233923369685352449>\n7\n\n<@348774809003491329>\n7',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Количество опубликованных сообщений',
        footer: {
          text: '1 - 5 из 12 по 5',
        },
      }),
    ],
  },
];
