/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: true,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: null,
    features: [
      'Удалена команда join',
      'Команды play, radio, shikimori отключены, так как функции плеера не работают в связи в внешними причинами',
    ],
    bugfixes: [],
    footer: null,
  },
};
