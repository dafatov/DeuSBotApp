/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: false,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: 'УРА!!!! Бот починился и теперь снова может играть!!!',
    features: [
      'Добавлена возможность экспорта аниме с шикимори для импорта в anilist.co командой /shikimori export'
    ],
    bugfixes: [],
    footer: null,
  },
};
