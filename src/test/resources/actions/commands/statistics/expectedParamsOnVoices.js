const {ActionRowBuilder, EmbedBuilder} = require('discord.js');

module.exports = {
  components: [
    new ActionRowBuilder({
      components: [
        {
          custom_id: 'first',
          disabled: false,
          label: '|<',
          style: 1,
          type: 2,
        },
        {
          custom_id: 'previous',
          disabled: false,
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
          disabled: true,
          label: '>',
          style: 1,
          type: 2,
        },
        {
          custom_id: 'last',
          disabled: true,
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
      description: '<@531429539176513546>\n0\n\n<@155149108183695360>\n0',
      timestamp: new Date('2023-02-06T10:20:27.013Z'),
      title: 'Время, проведенное в голосовых каналах',
      footer: {
        text: '11 - 12 из 12 по 5',
      },
    }),
  ],
};
