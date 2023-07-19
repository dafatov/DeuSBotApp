const {EmbedBuilder} = require('discord.js');
const interaction = require('../../mocks/commandInteraction');

module.exports = [
  interaction, {
    embeds: [
      new EmbedBuilder({
        color: 16711680,
        description: 'Произошла ошибка с запуском команды "clear". Сообщите администратору идентификатор записи в логах для быстрой диагностики проблемы.\n```id = 123```',
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Что-то пошло не так...',
      }),
    ],
  },
];
