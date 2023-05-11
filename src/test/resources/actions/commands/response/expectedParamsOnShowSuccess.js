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
      fields: [
        {
          name: 'regex 6',
          value: 'react 6',
        },
        {
          name: 'regex 7',
          value: 'react 7',
        },
      ],
      footer: {
        text: '6 - 7 из 7 по 5',
      },
      timestamp: new Date('2023-02-06T10:20:27.013Z'),
      title: 'Все реакции на текущий момент',
    }),
  ],
};
