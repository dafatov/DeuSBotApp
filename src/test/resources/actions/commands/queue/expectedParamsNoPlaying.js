const {MessageActionRow, MessageEmbed} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    components: [
      new MessageActionRow({
        components: [
          {
            'custom_id': 'first',
            'disabled': true,
            'label': '|<',
            'style': 1,
            'type': 2,
          },
          {
            'custom_id': 'previous',
            'disabled': true,
            'label': '<',
            'style': 1,
            'type': 2,
          },
          {
            'custom_id': 'update',
            'disabled': false,
            'label': 'Обновить',
            'style': 1,
            'type': 2,
          },
          {
            'custom_id': 'next',
            'disabled': true,
            'label': '>',
            'style': 1,
            'type': 2,
          },
          {
            'custom_id': 'last',
            'disabled': true,
            'label': '>|',
            'style': 1,
            'type': 2,
          },
        ],
        'type': 1,
      }),
    ],
    embeds: [
      new MessageEmbed({
        color: 16746496,
        description: 'Может ли существовать мир без музыки? Каким бы он был...\nАх да! Таким, в котором сейчас живешь ты~~',
        footer: {
          text: '0 - 0 из 0 по 5',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Мир музыки пуст',
      }),
    ],
  },
];
