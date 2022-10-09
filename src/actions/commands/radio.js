const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {getQueue, hasLive, playPlayer} = require('../player');
const {timeFormatMilliseconds, timeFormatSeconds} = require('../../utils/dateTime');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {escaping} = require('../../utils/string');
const {getRadios} = require('../radios');
const {notify} = require('../commands');
const {remained} = require('../../utils/calc');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription(t('discord:command.radio.description'))
    .addSubcommandGroup(g => {
      const radios = getRadios();
      let localG = g;

      for (let i = 0; i < Math.ceil(radios.size / 25); i++) {
        const choices = [...radios.keys()].sort().map(k => [k.toString(), k.toString()]).splice(25 * i, 25);

        localG = localG.addSubcommand(s => s
          .setName((i + 1).toString())
          .setDescription(t('discord:command.radio.page.radioStation.description', {
            pageStart: choices[0][0][0],
            pageEnd: choices[choices.length - 1][0][0],
          }))
          .addStringOption(s => s
            .setName('station')
            .setDescription(t('discord:command.radio.page.radioStation.option.station.description'))
            .setRequired(true)
            .addChoices(choices)));
      }
      g.setName('page');
      g.setDescription(t('discord:command.radio.page.description'));
      return localG;
    }),
  async execute(interaction) {
    await module.exports.radio(interaction, true);
  },
};

module.exports.radio = async (interaction, isExecute, stationKey = interaction.options.getString('station')) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_RADIO)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'radio'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('radio', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'radio'}),
    });
    return {result: t('web:info.forbidden', {command: 'radio'})};
  }

  if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
    && getQueue(interaction.guildId).connection.joinConfig.channelId
    !== interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unequalChannels.title'))
      .setDescription(t('discord:embed.unequalChannels.description'))
      .setTimestamp();
    if (isExecute) {
      await notify('radio', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.clear.unequalChannels'),
    });
    return {result: t('web:info.unequalChannels')};
  }

  const station = getRadios().get(stationKey);
  const info = {
    id: `${new Date().getTime()}`,
    type: 'radio',
    title: stationKey,
    length: 0,
    url: station.channel.url,
    isLive: true,
    preview: station.channel.preview,
    author: interaction.user,
  };
  getQueue(interaction.guildId).songs.push(info);

  const remainedValue = remained(getQueue(interaction.guildId));
  getQueue(interaction.guildId).remained = (getQueue(interaction.guildId).remained ?? 0) + parseInt(info.length);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(info.title))
    .setURL(info.url)
    .setDescription(t('discord:command.radio.completed.description', {
      allLength: info.isLive
        ? t('common:player.stream')
        : timeFormatSeconds(info.length),
      length: getQueue(interaction.guildId).songs.length,
      beginIn: hasLive(getQueue(interaction.guildId))
        ? t('common:player.noRemained')
        : remainedValue === 0
          ? t('common:player.beginNow')
          : timeFormatMilliseconds(remainedValue),
    }))
    .setThumbnail(info.preview)
    .setTimestamp()
    .setFooter(t('discord:command.radio.completed.footer', {username: interaction.user.username}), interaction.user.displayAvatarURL());
  if (isExecute) {
    await notify('radio', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.radio'),
  });

  await playPlayer(interaction);
  return {info};
};
