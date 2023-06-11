/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: true,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: 'Теперь можно воспроизводить музыку из файла!!! Для этого нужно... ссылка в описании',
    features: [
      'Добавил возможность воспроизводить аудиофайлы',
      'Добавил вывод пользователю сообщения, если при запуске команды произошла ошибка'
    ],
    bugfixes: [
      'Исправлена ситуация, когда пользователь не в голосовом канале может добавить композиции в плеер'
    ],
    footer: 'Для того чтобы воспроизвести аудиофайл, необходимо в команде play выбрать аргумент attachment и прикрепить в нее композицию, затем запустить команду',
  },
};
