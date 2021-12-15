const {SlashCommandBuilder} = require("@discordjs/builders");
const {shuffleArray} = require("../../utils/array");
const {MessageEmbed} = require("discord.js");
const {logGuild} = require("../../utils/logger");
const {notify} = require("../commands");
const config = require("../../configs/config.js");
const {getQueue} = require("../player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Перемешать очередь'),
  async execute(interaction) {
    await shuffle(interaction);
  },
  async listener(interaction) {}
}

const shuffle = async (interaction) => {
  if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player
    || getQueue(interaction.guildId).songs.length <= 2) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Ты одинок что ли? Соло-игрок?')
      .setDescription(`${getQueue(interaction.guildId).songs.length === 0
        ? 'Пытаться перемещать то, чего нет, показывает все твое отчаяние. **Пуст плейлист. Пуст.**'
        : 'В одиночку, конечно, можно получить удовольствие, но двигать то все равно не куда. **Одна песня в плейлисте. Как ты...**'}`)
      .setTimestamp();
    await notify('shuffle', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[shuffle]: Пропустить композицию не вышло: плеер не играет`);
    return;
  }

  if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
    && getQueue(interaction.guildId).connection.joinConfig.channelId !==
    interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Канал не тот')
      .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
      .setTimestamp();
    await notify('shuffle', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[shuffle]: Пропустить композицию не вышло: не совпадают каналы`);
    return;
  }

  shuffleArray(getQueue(interaction.guildId).songs);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle('Плейлист ~~взболтан~~ перемешан')
    .setDescription(`Это было суровое время.. Мы мешали песни как могли, чтобы хоть как-то разнообразить свою серую жизнь..
            И  пришел он!! Генератор Псевдо Случайных Чисел или _ГПСЧ_! Он спас нас, но остался в безизвестности.. Так давайте восславим его.
            Присоединяйтесь к _культу ГПСЧ_!!! Да пребудет с Вами **Бог Псевдо Рандома**`);
  await notify('shuffle', interaction, {embeds: [embed]});
  logGuild(interaction.guildId, `[shuffle]: Плейлист успешно перемешан`);
}

