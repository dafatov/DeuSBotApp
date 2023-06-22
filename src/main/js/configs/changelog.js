/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: true,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: null,
    features: [
      'Добавлена поддержка flac для воспроизведения файла',
      'Добавлена поддержка воспроизведения по любой ссылке со звуковой дорожкой',
    ],
    bugfixes: [
      'Исправлено не отображение часового пояса во времени/дате при выборе резервной копии',
      'Исправлены проблемы при использовании команды /shikimori play',
    ],
    footer: null,
  },
};
