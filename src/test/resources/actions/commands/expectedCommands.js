module.exports = [
  {
    description: 'Манипулирование системой дней рождений',
    name: 'birthday',
    options: [
      {
        description: 'Установление даты рождения',
        name: 'set',
        options: [
          {
            description: 'Год',
            name: 'year',
            required: true,
            type: 4,
          },
          {
            description: 'Месяц',
            name: 'month',
            required: true,
            type: 4,
          },
          {
            description: 'День',
            name: 'day',
            required: true,
            type: 4,
          },
        ],
        type: 1,
      },
      {
        description: 'Удаление даты рождения',
        name: 'remove',
        options: [],
        type: 1,
      },
      {
        description: 'Отображение текущей даты рождения',
        name: 'show',
        options: [
          {
            choices: [
              {
                name: 'Январь',
                value: '0',
              },
              {
                name: 'Февраль',
                value: '1',
              },
              {
                name: 'Март',
                value: '2',
              },
              {
                name: 'Апрель',
                value: '3',
              },
              {
                name: 'Май',
                value: '4',
              },
              {
                name: 'Июнь',
                value: '5',
              },
              {
                name: 'Июль',
                value: '6',
              },
              {
                name: 'Август',
                value: '7',
              },
              {
                name: 'Сентябрь',
                value: '8',
              },
              {
                name: 'Октябрь',
                value: '9',
              },
              {
                name: 'Ноябрь',
                value: '10',
              },
              {
                name: 'Декабрь',
                value: '11',
              },
            ],
            description: 'Месяц',
            name: 'month',
            required: false,
            type: 3,
          },
        ],
        type: 1,
      },
      {
        description: 'Переключить вывод уведомлений напоминающих о регистрации',
        name: 'ignore',
        options: [],
        type: 1,
      },
    ],
  },
  {
    description: 'Очистить очередь',
    name: 'clear',
    options: [],
  },
  {
    description: 'Переместить композицию с места в очереди на первую',
    name: 'first',
    options: [
      {
        description: 'Номер в очереди целевой композиции',
        name: 'target',
        required: true,
        type: 4,
      },
    ],
  },
  {
    description: 'Детальное описание тонкостей работы некоторых команд',
    name: 'help',
    options: [
      {
        choices: [
          {
            name: 'help',
            value: 'help',
          },
        ],
        description: 'Наименование команды',
        name: 'command',
        required: false,
        type: 3,
      },
    ],
  },
  {
    description: 'Манипулирование пожеланиями',
    name: 'issue',
    options: [
      {
        choices: [
          {
            name: 'Ошибка',
            value: 'bug',
          },
          {
            name: 'Улучшение',
            value: 'enhancement',
          },
          {
            name: 'Документация',
            value: 'documentation',
          },
        ],
        description: 'Тип предложения',
        name: 'type',
        required: true,
        type: 3,
      },
      {
        description: 'Заголовок предложения',
        name: 'title',
        required: true,
        type: 3,
      },
      {
        description: 'Подробное описание предложения. Для ошибок в формате: как вышло, что ожидалось, что вышло',
        name: 'details',
        required: true,
        type: 3,
      },
    ],
  },
  {
    description: 'Зациклить/отциклить проигрывание композиции',
    name: 'loop',
    options: [],
  },
  {
    description: 'Переместить композицию с места в очереди на другое',
    name: 'move',
    options: [
      {
        description: 'Номер в очереди целевой композиции',
        name: 'target',
        required: true,
        type: 4,
      },
      {
        description: 'Номер конечной позиции целевой композиции',
        name: 'position',
        required: true,
        type: 4,
      },
    ],
  },
  {
    description: 'Отобразить текущую композицию',
    name: 'np',
    options: [],
  },
  {
    description: 'Приостановить/возобновить проигрывание композиции',
    name: 'pause',
    options: [],
  },
  {
    description: 'Пинг и отпинг',
    name: 'ping',
    options: [],
  },
  {
    description: 'Воспроизвести в боте аудио',
    name: 'play',
    options: [
      {
        description: 'Url или наименование видео записи с youtube',
        name: 'audio',
        required: false,
        type: 3,
      },
    ],
  },
  {
    description: 'Манипулирование новостным информатором',
    name: 'publicist',
    options: [
      {
        description: 'Добавление или изменение информационного канала',
        name: 'set',
        options: [
          {
            description: 'Канал, именуемый информационным',
            name: 'channel',
            required: true,
            type: 7,
          },
        ],
        type: 1,
      },
      {
        description: 'Удаление информационного канала',
        name: 'remove',
        options: [],
        type: 1,
      },
      {
        description: 'Отображение текущего информационного канала',
        name: 'show',
        options: [],
        type: 1,
      },
    ],
  },
  {
    description: 'Отображение очереди композиций на воспроизведение',
    name: 'queue',
    options: [],
  },
  {
    description: 'Запустить проигрывание радио',
    name: 'radio',
    options: [
      {
        description: 'Номер страницы',
        name: 'page',
        options: [],
        type: 2,
      },
    ],
  },
  {
    description: 'Удаляет композицию из очереди',
    name: 'remove',
    options: [
      {
        description: 'Номер в очереди целевой композиции',
        name: 'target',
        required: true,
        type: 4,
      },
    ],
  },
  {
    description: 'Манипулирование реакциями',
    name: 'response',
    options: [
      {
        description: 'Добавление или изменение реакции',
        name: 'set',
        options: [
          {
            description: 'Шаблон, определяющий на какое сообщение реагировать',
            name: 'regex',
            required: true,
            type: 3,
          },
          {
            description: 'Текст реакции',
            name: 'react',
            required: true,
            type: 3,
          },
        ],
        type: 1,
      },
      {
        description: 'Удаление существующей реакции. Может удалять то, чего нет',
        name: 'remove',
        options: [
          {
            description: 'Шаблон, определяющий на какое сообщение реагировать',
            name: 'regex',
            required: true,
            type: 3,
          },
        ],
        type: 1,
      },
      {
        description: 'Отображение существующий реакций в виде списка',
        name: 'show',
        options: [],
        type: 1,
      },
    ],
  },
  {
    description: 'Восстанавливает данные из резервных копий',
    name: 'restore',
    options: [
      {
        choices: [
          {
            name: 'queue',
            value: 'queue',
          },
        ],
        description: 'Наименование таблицы в базе данных',
        name: 'table',
        required: true,
        type: 3,
      },
    ],
  },
  {
    description: 'Команды взаимодействия с shikimori',
    name: 'shikimori',
    options: [
      {
        description: 'Проигрывает случайную композицию случайного аниме из списка просмотрено и смотрю с шикимори',
        name: 'play',
        options: [
          {
            choices: [
              {
                name: 'nickname1',
                value: 'login1',
              },
              {
                name: 'nickname2',
                value: 'login2',
              },
            ],
            description: 'Имя пользователя в рамках системы DeuS',
            name: 'nickname',
            required: true,
            type: 3,
          },
          {
            description: 'Количество композиций',
            name: 'count',
            required: false,
            type: 4,
          },
        ],
        type: 1,
      },
      {
        description: 'Добавление или изменение аккаунтов shikimori',
        name: 'set',
        options: [
          {
            description: 'Логин с шикимори',
            name: 'login',
            required: true,
            type: 3,
          },
          {
            description: 'Имя в рамках системы DeuS',
            name: 'nickname',
            required: true,
            type: 3,
          },
        ],
        type: 1,
      },
      {
        description: 'Удаление аккаунта shikimori по логину',
        name: 'remove',
        options: [
          {
            description: 'Логин с шикимори',
            name: 'login',
            required: true,
            type: 3,
          },
        ],
        type: 1,
      },
      {
        description: 'Экспортирует список аниме в формате приемлемом для anilist.co',
        name: 'export',
        options: [
          {
            choices: [
              {
                name: 'nickname1',
                value: 'login1',
              },
              {
                name: 'nickname2',
                value: 'login2',
              },
            ],
            description: 'Имя пользователя в рамках системы DeuS',
            name: 'nickname',
            required: true,
            type: 3,
          },
        ],
        type: 1,
      },
    ],
  },
  {
    description: 'Перемешать очередь',
    name: 'shuffle',
    options: [],
  },
  {
    description: 'Пропустить текущую композицию',
    name: 'skip',
    options: [],
  },
  {
    description: 'Отображение статистики пользователей',
    name: 'statistics',
    options: [
      {
        description: 'Отображение последней активной сессии в голосовом канале на сервере',
        name: 'session',
        options: [],
        type: 1,
      },
      {
        description: 'Отображение количества сообщений, написанных каждым пользователем',
        name: 'messages',
        options: [],
        type: 1,
      },
      {
        description: 'Отображение времени проведенного в голосовых каналах',
        name: 'voices',
        options: [],
        type: 1,
      },
    ],
  },
];
