/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: true,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: 'Теперь большой брат стал еще больше...',
    features: [
      'Добавил сессии у пользователей голосовых каналов для каждого сервера',
      'Добавил статистику количества отправленных сообщений и проведенного времени в голосовых каналах для всех серверов'
    ],
    bugfixes: [],
    footer: null,
  },
};
