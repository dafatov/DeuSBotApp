const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {logGuild} = require('../../utils/logger');
const {notify} = require('../commands');
const config = require('../../configs/config.js');
const {getQueue, playPlayer, hasLive} = require('../player');
const {escaping} = require('../../utils/string');
const {timeFormatSeconds, timeFormatMilliseconds} = require('../../utils/dateTime');
const {remained} = require('../../utils/calc');
const {getRadios} = require('../radios');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {audit} = require('../auditor');
const {TYPES, CATEGORIES} = require('../../db/repositories/audit');

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
    await module.exports.radio(interaction, true);
  },
  async listener(_interaction) {},
}

module.exports.radio = async (interaction, isExecute, stationKey = interaction.options.getString('station')) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RADIO)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Доступ к команде \"radio\" запрещен')
      .setTimestamp()
      .setDescription('Запросите доступ у администратора сервера');
    await notify('radio', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: 'Доступ к команде radio запрещен',
    });
    return {result: 'Доступ к команде запрещен'};
  }

  if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
    && getQueue(interaction.guildId).connection.joinConfig.channelId !==
    interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle('Канал не тот')
      .setDescription(`Мда.. шиза.. перепутать каналы это надо уметь`)
      .setTimestamp();
    if (isExecute) {
      await notify('radio', interaction, {embeds: [embed]});
    }
    logGuild(interaction.guildId, `[radio]: Запустить радио не вышло: не совпадают каналы`);
    return {result: "Не совпадают каналы"};
  }

  const station = getRadios().get(stationKey);
  let info = {
    id: `${new Date().getTime()}`,
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
    .setDescription(`Длительность: **${info.isLive
      ?
      '<Стрим>'
      : timeFormatSeconds(info.length)}**
            Место в очереди: **${getQueue(interaction.guildId).songs.length}**
            Начнется через: **${hasLive(getQueue(interaction.guildId))
      ? '<Никогда>'
      : remainedValue === 0
        ? '<Сейчас>'
        : timeFormatMilliseconds(remainedValue)}**`)
    .setThumbnail(info.preview)
    .setTimestamp()
    .setFooter(`Радиостанцию добавил пользователь ${interaction.user.username}`, interaction.user.displayAvatarURL());
  if (isExecute) {
    await notify('radio', interaction, {embeds: [embed]});
  }
  logGuild(interaction.guildId, `[radio]: Радиостанция успешно добавлена в очередь`);

  await playPlayer(interaction);
  return {info};
}
