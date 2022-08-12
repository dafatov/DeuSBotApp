const {SlashCommandBuilder} = require("@discordjs/builders");
const axios = require('axios').default;
const {searchSongs} = require("../commands/play.js");
const {logGuild, error} = require("../../utils/logger.js");
const {MessageEmbed} = require("discord.js");
const config = require("../../configs/config.js");
const {notify, notifyError, update} = require("../commands.js");
const db = require("../../repositories/users.js");
const {escaping} = require("../../utils/string.js");
const RandomOrg = require("random-org");

const MAX_COUNT = 100;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shikimori')
    .setDescription('Команды взаимодействия с shikimori')
    .addSubcommand(s => s
      .setName('play')
      .setDescription('Проигрывает случайную композицию случайного аниме из списка просмотрено и смотрю с шикимори')
      .addStringOption(s => s
        .setName('nickname')
        .setDescription('Имя пользователя в рамках системы DeuS')
        .setRequired(true))
      .addIntegerOption(i => i
        .setName('count')
        .setDescription('Количество композиций')
        .setRequired(false)))
    .addSubcommand(s => s
      .setName('set')
      .setDescription('Добавление или изменение аккаунтов shikimori')
      .addStringOption(o => o
        .setName('login')
        .setDescription('Логин с шикимори')
        .setRequired(true))
      .addStringOption(s => s
        .setName('nickname')
        .setDescription('Имя в рамках системы DeuS')
        .setRequired(true)))
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('Удаление аккаунта shikimori по логину')
      .addStringOption(s => s
        .setName('login')
        .setDescription('Логин с шикимори')
        .setRequired(true))),
  async execute(interaction) {
    await shikimori(interaction);
  },
  async listener(interaction) {},
  async update(interaction) {
    await update(interaction);
  }
}

module.exports.shikimoriPlay = async (interaction, login, count) => await play(interaction, false, login, count);

const shikimori = async (interaction) => {
  if (interaction.options.getSubcommand() === 'play') {
    await play(interaction, true);
  } else if (interaction.options.getSubcommand() === 'set') {
    await set(interaction);
  } else if (interaction.options.getSubcommand() === 'remove') {
    await remove(interaction);
  }
}

const play = async (interaction, isExecute, login = interaction.options.getString('nickname'), count = interaction.options.getInteger('count') || 1) => {
  let animes, response;

  try {
    response = await axios.get(`https://shikimori.one/${login}/list_export/animes.json`);
    animes = response.data.filter(a =>
      (a.status === 'completed' || a.status === 'watching')
      && a.episodes > 1
    );
  } catch (e) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Такого профиля не существует')
      .setDescription(`Ну ты и клоун, конечно...`)
      .setTimestamp();
    if (isExecute) {
      await notify('shikimori', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[shikimori]: Найти профиль shikimori не удалось`);
    return {result: "Найти профиль не удалось"};
  }

  if (count < 1 || count > MAX_COUNT) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Некорректное значения количества композиций')
      .setDescription(`Ну ты и клоун, конечно...
                _В связи с ограничением серверов youtube максимальное количество меньше ${MAX_COUNT}_`)
      .setTimestamp();
    if (isExecute) {
      await notify('shikimori', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[shikimori]: Некорректное количество`);
    return {result: "Некорректное количество выбранных композиций"};
  }

  let audios = [];
  animes.forEach(anime => {
    for (let j = 0; j < anime.episodes / 12; j++) {
      audios.push(`${anime.target_title} +opening ${j + 1} +full`);
      audios.push(`${anime.target_title} +ending ${j + 1} +full`);
    }
  });
  const random = new RandomOrg({apiKey: process.env.RANDOM_ORG_TOKEN});
  let requestsLeft = await random.generateIntegers({
      n: count,
      min: 0,
      max: audios.length - 1,
      replacement: false
    })
    .then(response => {
      return {requestsLeft: response.requestsLeft, data: response.random.data}
    })
    .then(response => {
      audios = audios.filter((_audio, index) => response.data.includes(index));
      logGuild(interaction.guildId, `[shikimori][search]: ${audios.join(', ')}`);
      return response.requestsLeft;
    }).catch(e => error(e));
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(requestsLeft >= 0 ? 'Плейлист формируется' : 'Рандома не осталось')
    .setDescription(requestsLeft >= 0
      ? `Выбраны аниме, песни и формируется плейлист. **Слышь, подожди!**`
      :
      'В связи с настойчивыми требованиями некоторых сущностей рандом реализован через random.org, но в связи с этим существует ограничение на количество запросов в 10000 в месяц. Хз как, но лимит исчерпан, так что терпим терпилы или донатим))')
    .setTimestamp();
  if (isExecute) {
    await notify('shikimori', interaction, {embeds: [embed]});
  }
  logGuild(interaction.guildId, requestsLeft >= 0
    ? `[shikimori]: Профиль найден, аниме выбраны и начато формирование плейлиста`
    : '[shikimori]: Лимит на количество запросов random.org исчерпан');
  if (requestsLeft >= 0) {
    await searchSongs(interaction, isExecute, audios, login);
  }
  return {login, count: audios.length};
}

const set = async (interaction) => {
  let {login, nickname} = {
    login: interaction.options.getString("login"),
    nickname: interaction.options.getString("nickname")
  }

  try {
    if (!login || !nickname) {
      await notifyError('shikimori', `Login or nickname is undefined: [login: "${login}", nickname: "${nickname}"]`, interaction);
    }

    try {
      await axios.get(`https://shikimori.one/${login}`);
    } catch (e) {
      await notifyError('shikimori', `Логин не существует: ${login}`, interaction);
    }

    await db.set({
      "login": login,
      "nickname": nickname
    });

    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Создан новый пользователь shikimori')
      .setTimestamp()
      .addField(escaping(login), escaping(nickname));
    await interaction.deferReply();
    await update(interaction.client);
    await interaction.editReply({embeds: [embed]});
    logGuild(interaction.guildId, `[shikimori]: Пользователь успешно добавлен`);
  } catch (e) {
    await notifyError('shikimori', e, interaction);
  }
}

const remove = async (interaction) => {
  let login = interaction.options.getString("login");

  try {
    if (!login) {
      await notifyError('shikimori', `Login is undefined: [login: "${login}"]`, interaction);
    }

    await db.deleteByLogin(login);

    const embed = new MessageEmbed()
      .setColor(config.colors.info)
      .setTitle('Удален пользователь shikimori')
      .setTimestamp()
      .setDescription(escaping(login));
    await interaction.deferReply();
    await update(interaction.client);
    await interaction.editReply({embeds: [embed]});
    logGuild(interaction.guildId, `[shikimori]: Пользователь успешно удален`);
  } catch (e) {
    await notifyError('shikimori', e, interaction);
  }
}
