/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: true,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: null,
    features: [
      'Изменена система changelog\'ов. Теперь сайт может сохранять историю изменений',
      'Проведен рефакторинг кода (code-style)',
    ],
    bugfixes: [
      'Исправлены некоторые опечатки',
    ],
    footer: null,
  },
};
