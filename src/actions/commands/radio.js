const {SlashCommandBuilder} = require("@discordjs/builders");
const {MessageEmbed} = require("discord.js");
const {logGuild} = require("../../utils/logger");
const {notify} = require("../commands");
const config = require("../../configs/config.js");
const {getQueue, playPlayer, hasLive} = require("../player");
const {escaping} = require("../../utils/string");
const {timeFormatSeconds, timeFormatmSeconds} = require("../../utils/dateTime");
const {remained} = require("../../utils/calc");
const {getRadios} = require("../radios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Запустить проигрывание радио')
    .addSubcommandGroup(g => {
      const radios = getRadios();
      let localG = g;

      for (let i = 0; i < Math.ceil(radios.size / 25); i++) {
        const choices = [...radios.keys()].sort().map(k => [k.toString(), k.toString()]).splice(25 * i, 25);

        localG = localG.addSubcommand(s => s
          .setName((i + 1).toString())
          .setDescription(`Страница ${choices[0][0][0]}-${choices[choices.length - 1][0][0]}`)
          .addStringOption(s => s
            .setName('station')
            .setDescription('Радиостанция')
            .setRequired(true)
            .addChoices(choices)))
      }
      g.setName('page');
      g.setDescription('Номер страницы');
      return localG;
    }),
  async execute(interaction) {
    await radio(interaction);
  },
  async listener(interaction) {}
}

const radio = async (interaction) => {
  if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
    && getQueue(interaction.guildId).connection.joinConfig.channelId !==
    interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Канал не тот')
      .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
      .setTimestamp();
    await notify('radio', interaction, {embeds: [embed]});
    logGuild(interaction.guildId, `[radio]: Запустить радио не вышло: не совпадают каналы`);
    return;
  }

  const stationKey = interaction.options.getString('station');
  const station = getRadios().get(stationKey);
  let info = {
    type: 'radio',
    title: stationKey,
    length: 0,
    url: station.channel.url,
    isLive: true,
    preview: station.channel.preview,
    author: interaction.user
  };
  getQueue(interaction.guildId).songs.push(info);

  const remainedValue = remained(getQueue(interaction.guildId));
  getQueue(interaction.guildId).remained = (getQueue(interaction.guildId).remained ?? 0) + parseInt(info.length);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(info.title))
    .setURL(info.url)
    .setDescription(`Длительность: **${info.isLive ?
      '<Стрим>' : timeFormatSeconds(info.length)}**
            Место в очереди: **${getQueue(interaction.guildId).songs.length}**
            Начнется через: **${hasLive(getQueue(interaction.guildId)) ? '<Никогда>' : remainedValue === 0 ? '<Сейчас>' : timeFormatmSeconds(remainedValue)}**`)
    .setThumbnail(info.preview)
    .setTimestamp()
    .setFooter(`Радиостанцию добавил пользователь ${interaction.user.username}`, interaction.user.displayAvatarURL());
  await notify('radio', interaction, {embeds: [embed]});
  logGuild(interaction.guildId, `[radio]: Радиостанция успешно добавлена в очередь`);

  await playPlayer(interaction);
}