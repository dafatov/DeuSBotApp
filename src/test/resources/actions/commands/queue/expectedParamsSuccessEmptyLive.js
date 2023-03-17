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
      new MessageActionRow({
        components: [
          {
            custom_id: 'pause',
            disabled: true,
            label: 'Приостановить',
            style: 4,
            type: 2,
          },
          {
            custom_id: 'skip',
            disabled: false,
            label: 'Пропустить',
            style: 1,
            type: 2,
          },
          {
            custom_id: 'loop',
            disabled: true,
            label: 'Зациклить',
            style: 3,
            type: 2,
          },
        ],
        type: 1,
      }),
    ],
    embeds: [
      new MessageEmbed({
        color: 16777040,
        description: '<Стрим>\n\\u200B\\n',
        footer: {
          text: '0 - 0 из 0 по 5',
        },
        thumbnail:  {
          url: 'https://i.ytimg.com/vi/W6q1AWnjNiU/hqdefault.jpg?sqp=-oaymwEjCNACELwBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLBv4UAae-UGi2Z0F1-XIoLRFLWifQ',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Spice and Wolf OP 1 FULL (with lyrics)',
        url: 'https://www.youtube.com/watch?v=W6q1AWnjNiU',
      }),
    ],
    files: [
      [67, 43, 89, 13]
    ],
  },
];
