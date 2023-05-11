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
      description: '<@905052906296852500>\n3\n\n<@229605426327584769>\n2\n\n<@381845173384249356>\n1\n\n<@531429539176513546>\n1\n\n<@395615758278852609>\n0',
      timestamp: new Date('2023-02-06T10:20:27.013Z'),
      title: 'Количество опубликованных сообщений',
      footer: {
        text: '6 - 10 из 12 по 5',
      },
    }),
  ],
};
