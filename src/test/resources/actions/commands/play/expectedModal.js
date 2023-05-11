const {ModalBuilder} = require('discord.js');
module.exports = new ModalBuilder({
  components: [
    {
      components: [
        {
          custom_id: 'playTextInput0',
          label: '#1',
          placeholder: 'Url или наименование видео записи с youtube',
          required: true,
          style: 1,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'playTextInput1',
          label: '#2',
          placeholder: 'Url или наименование видео записи с youtube',
          required: false,
          style: 1,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'playTextInput2',
          label: '#3',
          placeholder: 'Url или наименование видео записи с youtube',
          required: false,
          style: 1,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'playTextInput3',
          label: '#4',
          placeholder: 'Url или наименование видео записи с youtube',
          required: false,
          style: 1,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'playTextInput4',
          label: '#5',
          placeholder: 'Url или наименование видео записи с youtube',
          required: false,
          style: 1,
          type: 4,
        },
      ],
      type: 1,
    },
  ],
  custom_id: 'play',
  title: 'Добавление в очередь плеера',
});
