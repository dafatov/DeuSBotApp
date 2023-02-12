/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: false,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: 'Baka~ и вовсе я не расстроился от того, что статистика удалилась',
    features: [
      'Добавил возможность обновить в команде queue, если плеер не играет',
    ],
    bugfixes: [
      'Исправил /statistics',
      'Исправил некорректное отображение страниц в командах: /response.show, /statistics.*, /queue',
    ],
    footer: 'В связи с обновлением базы данных для починки дефекта данные статистики было решено удалить',
  },
};
