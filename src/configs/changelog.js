/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string, footer: string, announce: string}}}
 */
module.exports = {
  isPublic: true,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: 'И никто не пользуется сайтом... плак.. плак..',
    features: [],
    bugfixes: [
      'Исправлена ошибка при протухании сессии авторизации',
    ],
    footer: null,
  },
};
