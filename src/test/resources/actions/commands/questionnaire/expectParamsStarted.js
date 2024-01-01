const {ActionRowBuilder, EmbedBuilder} = require('discord.js');
const interaction = require('../../../mocks/modalSubmitInteraction');

module.exports = [
  interaction, {
    components: [
      new ActionRowBuilder({
        components: [
          {
            custom_id: 'optionButton_0',
            label: 'value_1',
            style: 1,
            type: 2,
          },
        ],
        type: 1,
      }),
      new ActionRowBuilder({
        components: [
          {
            custom_id: 'optionButton_1',
            label: 'value_2',
            style: 1,
            type: 2,
          },
        ],
        type: 1,
      }),
      new ActionRowBuilder({
        components: [
          {
            custom_id: 'optionButton_2',
            label: 'value_5',
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
        description: '_Выберите один из вариантов ниже нажатием на кнопку. Вам выведется сообщение с Вашим выбором_',
        timestamp: '2023-02-06T10:20:27.013Z',
        title: 'title title title (2 минуты осталось)',
      }),
    ],
  },
];
