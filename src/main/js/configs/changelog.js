/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: true,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: 'Временно команда радио отключена, так как radiorecord не работает в Орегоне...',
    features: [
      'Теперь при очереди длиннее суток будет соответсвующий текст в нужных местах'
    ],
    bugfixes: [
      'Исправил сломанную очистку уничтожения connection при выходе из голосового канала'
    ],
    footer: null,
  },
};
