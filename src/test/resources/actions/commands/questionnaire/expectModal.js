const {ModalBuilder} = require('discord.js');

module.exports = new ModalBuilder({
  components: [
    {
      components: [
        {
          custom_id: 'questionnaireOption0',
          label: '#1',
          max_length: 80,
          required: true,
          style: 2,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'questionnaireOption1',
          label: '#2',
          max_length: 80,
          required: false,
          style: 2,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'questionnaireOption2',
          label: '#3',
          max_length: 80,
          required: false,
          style: 2,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'questionnaireOption3',
          label: '#4',
          max_length: 80,
          required: false,
          style: 2,
          type: 4,
        },
      ],
      type: 1,
    }, {
      components: [
        {
          custom_id: 'questionnaireOption4',
          label: '#5',
          max_length: 80,
          required: false,
          style: 2,
          type: 4,
        },
      ],
      type: 1,
    },
  ],
  custom_id: 'questionnaire 2\ntitle_title_title',
  title: 'title title title (2 минуты)',
});
