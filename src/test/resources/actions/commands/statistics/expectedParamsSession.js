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
        description: '<@909473788779958363>\n<t:1678019292>\n`<Сейчас>`\n\n<@348774809003491329>\n<t:1677935280>\n<t:1677936929>\n`27 минут 28 секунд 987 миллисекунд`',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Последняя активная сессия',
        footer: {
          text: '1 - 2 из 2 по 5',
        },
      }),
    ],
  },
];
