/**
 * @type {{isPublic: boolean, message: {features: string[], bugfixes: string[], ad: string | null, footer: string | null, announce: string | null}}}
 */
module.exports = {
  isPublic: false,
  message: {
    ad: 'В случае нахождения недостатков или предложений используйте команду /issue. Чем подробнее Вы опишите свою заявку, тем быстрее она будет рассмотрена',
    announce: null,
    features: [
      'Теперь можно добавлять несколько композиций за раз командой play. Для этого нужно запустить команду без аргументов и откроется модальное окно'
    ],
    bugfixes: [],
    footer: null,
  },
};
