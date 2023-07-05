const {ModalBuilder} = require('discord.js');

module.exports = new ModalBuilder({
  components: [
    {
      components: [
        {
          custom_id: 'title',
          label: 'Заголовок',
          placeholder: 'Краткое наименование',
          required: true,
          style: 1,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'details',
          label: 'Детали',
          placeholder: '1. Шаги воспроизведения\n2. Ожидаемый результат\n3. Фактический результат',
          required: true,
          style: 2,
          type: 4,
        },
      ], type: 1,
    },
  ],
  custom_id: 'issue bug',
  title: 'Создание заявки ""',
});
