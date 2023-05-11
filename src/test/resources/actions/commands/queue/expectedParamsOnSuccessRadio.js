const {ActionRowBuilder, EmbedBuilder} = require('discord.js');

module.exports = [
  {
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
      new ActionRowBuilder({
        components: [
          {
            custom_id: 'pause',
            disabled: false,
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
            disabled: false,
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
        description: '\nИсточник: **artist**\nКомпозиция: **song**\n\n06). [YUREI DECO - Opening \\| 1,000,000,000,000,000,000,000,000 LOVE](https://www.youtube.com/watch?v=jN8tcrzSQNc)\n`00:01:40`—_`DemetriouS`_\n\n07). [Spice and Wolf OP 1 FULL (with lyrics)](https://www.youtube.com/watch?v=W6q1AWnjNiU)\n`00:04:52`—_`DemetriouS`_\n\n08). [Hacking To The Gate (Steins;Gate OP synthwave 80s remix) by Astrophysics](https://www.youtube.com/watch?v=ERlBHyOjeLI)\n`00:04:13`—_`DemetriouS`_\n\n09). [No Man’s Dawn \\| OVERLORD S4 ED [FULL ENGLISH COVER]](https://www.youtube.com/watch?v=bvAR0Ec6tnk)\n`00:05:07`—_`DemetriouS`_\n\n10). [Seishun Complex \\| BOCCHI THE ROCK! [FULL ENGLISH COVER]](https://www.youtube.com/watch?v=2Fkq-n-lZQk)\n`00:04:13`—_`DemetriouS`_',
        footer: {
          text: '6 - 10 из 13 по 5',
        },
        thumbnail: {
          url: 'https://i.ytimg.com/vi/W6q1AWnjNiU/hqdefault.jpg?sqp=-oaymwEjCNACELwBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLBv4UAae-UGi2Z0F1-XIoLRFLWifQ',
        },
        timestamp: new Date('2023-02-06T10:20:27.013Z'),
        title: 'Spice and Wolf OP 1 FULL (with lyrics)',
        url: 'https://www.youtube.com/watch?v=W6q1AWnjNiU',
      }),
    ],
    files: [
      [67, 43, 89, 13],
    ],
  },
];
