/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: false,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: 'Теперь у бота есть система доступа. А значит, что по умолчанию никто не имеет никаких прав... хех.. Мне впадлу, поэтому пусть Вова (<@233923369685352449>) этим занимается',
    features: [
      'Добавлена система контроля прав доступа. Редактор прав доступен на сайте бота',
    ],
    bugfixes: [
      'Исправлены некорректные выводы логов',
      'Исправлена ошибка при первом запуске базы данных локально',
    ],
    footer: null,
  },
};
