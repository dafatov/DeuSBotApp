/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: true,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: 'Хотел починить боту радио, а оно и так работает... Ну что ж... зато немного отрефакторил..',
    features: [
      'Удалил Anison.FM - у них нет своей api, а каждый раз вытаскивать меняющиеся url - сложно'
    ],
    bugfixes: [],
    footer: null,
  },
};
