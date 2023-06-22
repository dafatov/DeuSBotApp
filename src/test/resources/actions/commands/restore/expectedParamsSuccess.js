const {ActionRowBuilder, StringSelectMenuBuilder} = require('discord.js');
const interaction = require('../../../mocks/commandInteraction');

module.exports = [
  interaction, {
    components: [
      new ActionRowBuilder({
        components: [
          new StringSelectMenuBuilder({
            customId: 'select',
            options: [
              {
                label: '30.05.2023, 00:01:56 GMT',
                value: '414',
              },
              {
                label: '30.05.2023, 19:31:17 GMT',
                value: '433',
              },
              {
                label: '31.05.2023, 00:01:56 GMT',
                value: '500',
              },
              {
                label: '02.06.2023, 16:59:59 GMT',
                value: '452',
              },
            ],
            placeholder: 'Дата/время образа резервной копии',
            type: 3,
          }),
        ],
      }),
    ],
  },
];
