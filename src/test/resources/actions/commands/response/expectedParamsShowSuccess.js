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
        fields: [
          {
            name: 'regex 1',
            value: 'react 1',
          },
          {
            name: 'regex 2',
            value: 'react 2',
          },
          {
            name: 'regex 3',
            value: 'react 3',
          },
          {
            name: 'regex 4',
            value: 'react 4',
          },
          {
            name: 'regex 5',
            value: 'react 5',
          },
        ],
        footer: {
          text: '1 - 5 из 7 по 5',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Все реакции на текущий момент',
      }),
    ],
  },
];
