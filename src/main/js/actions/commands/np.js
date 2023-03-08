const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {timeFormatMilliseconds, timeFormatSeconds} = require('../../utils/dateTime');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {createStatus} = require('../../utils/attachments');
const {escaping} = require('../../utils/string.js');
const {getQueue} = require('../player');
const {getRadios} = require('../radios');
const {notify} = require('../commands');
const progressBar = require('string-progressbar');
const {t} = require('i18next');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('np')
    .setDescription(t('discord:command.np.description')),
  async execute(interaction) {
    await np(interaction);
  },
};

const np = async interaction => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_NP)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'np'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('np', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'np'}),
    });
    return;
  }

  const info = getQueue(interaction.guildId).nowPlaying;

  if (!getQueue(interaction.guildId).connection || !getQueue(interaction.guildId).player || !info.song) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.noPlaying.title'))
      .setDescription(t('discord:embed.noPlaying.description'))
      .setTimestamp();
    await notify('np', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.np.noPlaying'),
    });
    return;
  }

  if (!interaction.member.voice.channel || getQueue(interaction.guildId).connection
    && getQueue(interaction.guildId).connection.joinConfig.channelId
    !== interaction.member.voice.channel.id) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.unequalChannels.title'))
      .setDescription(t('discord:embed.unequalChannels.description'))
      .setTimestamp();
    await notify('np', interaction, {embeds: [embed]});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.np.unequalChannels'),
    });
    return;
  }

  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(info.song.title))
    .setURL(info.song.url)
    .setThumbnail(info.song.preview)
    .setTimestamp()
    .setFooter({
      text: t('discord:command.np.completed.footer', {author: info.song.author.username}),
      iconURL: info.song.author.displayAvatarURL()
    });
  if (getQueue(interaction.guildId).nowPlaying.song.isLive) {
    embed.setDescription(t('discord:command.np.completed.description.live'));
    if (getQueue(interaction.guildId).nowPlaying.song.type === 'radio') {
      embed.setDescription(await getRadios().get(info.song.title).getInfo());
    }
  } else {
    const barString = progressBar.filledBar(
      getQueue(interaction.guildId).nowPlaying.song.length * 1000,
      getQueue(interaction.guildId).nowPlaying.resource.playbackDuration,
    );
    embed.setDescription(t('discord:command.np.completed.description.withBar', {
      playbackDuration: timeFormatMilliseconds(getQueue(interaction.guildId).nowPlaying.resource.playbackDuration),
      length: timeFormatSeconds(getQueue(interaction.guildId).nowPlaying.song.length),
      author: getQueue(interaction.guildId).nowPlaying.song.author.username,
      barString: barString[0],
      percent: Math.round(barString[1]),
    }));
  }
  const status = await createStatus(getQueue(interaction.guildId));
  await notify('np', interaction, {files: [status], embeds: [embed]});
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.np.completed'),
  });
};
