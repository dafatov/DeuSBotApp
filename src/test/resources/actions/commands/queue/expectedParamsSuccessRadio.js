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
      new ActionRowBuilder({
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
      new EmbedBuilder({
        color: 16777040,
        description: '\nИсточник: **artist**\nКомпозиция: **song**\n\n01). [Hacking To The Gate (Steins;Gate OP synthwave 80s remix) by Astrophysics](https://www.youtube.com/watch?v=ERlBHyOjeLI)\n`<Стрим>`—_`Кагомэ`_\n\n02). [No Man’s Dawn \\| OVERLORD S4 ED [FULL ENGLISH COVER]](https://www.youtube.com/watch?v=bvAR0Ec6tnk)\n`00:05:07`—_`DemetriouS`_\n\n03). [Seishun Complex \\| BOCCHI THE ROCK! [FULL ENGLISH COVER]](https://www.youtube.com/watch?v=2Fkq-n-lZQk)\n`<Стрим>`—_`DemetriouS`_\n\n04). [HAMEFURA OP \\| Otome no Route wa Hitotsu Janai! [ENGLISH COVER]](https://www.youtube.com/watch?v=sPl_q_NoOGs)\n`00:02:45`—_`DemetriouS`_\n\n05). [Shikimori\'s Not Just a Cutie - Opening \\| Honey Jet Coaster](https://www.youtube.com/watch?v=Bme2siFikIs)\n`00:01:41`—_`DemetriouS`_',
        footer: {
          text: '1 - 5 из 13 по 5',
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
