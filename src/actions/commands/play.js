const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {SCOPES, isForbidden} = require('../../db/repositories/permission');
const {getQueue, hasLive, playPlayer} = require('../player.js');
const {notify, notifyError} = require('../commands.js');
const {timeFormatMilliseconds, timeFormatSeconds} = require('../../utils/dateTime.js');
const {MessageEmbed} = require('discord.js');
const {SlashCommandBuilder} = require('@discordjs/builders');
const {audit} = require('../auditor');
const config = require('../../configs/config.js');
const {escaping} = require('../../utils/string.js');
const {options} = require('../player');
const progressBar = require('string-progressbar');
const {remained} = require('../../utils/calc.js');
const {t} = require('i18next');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(t('discord:command.play.description'))
    .addStringOption(o => o
      .setName('audio')
      .setDescription(t('discord:command.play.option.audio.description'))
      .setRequired(true)),
  async execute(interaction) {
    await module.exports.play(interaction, true);
  },
};

module.exports.play = async (interaction, isExecute, audio = interaction.options.getString('audio')) => {
  if (await isForbidden(interaction.user.id, SCOPES.COMMAND_PLAY)) {
    const embed = new MessageEmbed()
      .setColor(config.colors.warning)
      .setTitle(t('discord:embed.forbidden.title', {command: 'play'}))
      .setTimestamp()
      .setDescription(t('discord:embed.forbidden.description'));
    await notify('play', interaction, {embeds: [embed], ephemeral: true});
    await audit({
      guildId: interaction.guildId,
      type: TYPES.INFO,
      category: CATEGORIES.PERMISSION,
      message: t('inner:info.forbidden', {command: 'play'}),
    });
    return {result: t('web:info.forbidden', {command: 'play'})};
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
      await notify('play', interaction, {embeds: [embed]});
    }
    await audit({
      guildId: interaction.guildId,
      type: TYPES.WARNING,
      category: CATEGORIES.COMMAND,
      message: t('inner:audit.command.play.unequalChannels'),
    });
    return {result: t('web:info.unequalChannels')};
  }

  let added;

  try {
    await ytpl.getPlaylistID(audio).then(async a => {
      await ytpl(a, {limit: Infinity, ...options}).then(async p => {
        added = await playPlaylist(interaction, p, isExecute);
        await playPlayer(interaction, isExecute);
      }).catch(async e => {
        if (isExecute) {
          await notifyError('play', e, interaction);
        }
        return {result: e};
      });
    }).catch(async () => {
      if (ytdl.validateURL(audio)) {
        await ytdl.getBasicInfo(audio, options).then(async i => {
          added = await notifySong(interaction, addQueue(interaction, i), isExecute);
          await playPlayer(interaction, isExecute);
        }).catch(err => {
          throw err;
        });
      } else {
        await ytsr(audio, {
          gl: 'RU',
          hl: 'ru',
          limit: 10,
        }, options).then(async r => {
          if (r.items.length === 0) {
            throw t('inner:error.youtubeApi');
          }
          let w = 0;
          while (w < 10) {
            await ytdl.getBasicInfo(r.items[w].url, options).then(async i => {
              added = await notifySong(interaction, addQueue(interaction, i), isExecute);
              await playPlayer(interaction, isExecute);
              w = 11;
            }).catch(() => {
              w++;
            });
          }
        }).catch(err => {
          throw err;
        });
      }
    });
  } catch (e) {
    if (isExecute) {
      await notifyError('play', e, interaction);
    }
    return {result: e};
  }
  return {added};
};

const playPlaylist = async (interaction, p, isExecute) => {
  let info;
  let allLength = 0;
  p.items.forEach((i, index) => {
    info = {
      id: `${new Date().getTime()}-${index}`,
      type: 'youtube',
      title: i.title,
      length: i.durationSec,
      url: i.shortUrl,
      isLive: i.isLive,
      preview: i.thumbnails[0].url,
      author: interaction.user,
    };
    getQueue(interaction.guildId).songs.push(info);
    allLength += parseInt(info.length);
  });

  info = {
    title: p.title,
    length: `${p.estimatedItemCount}`,
    duration: allLength,
    url: p.url,
    preview: p.thumbnails[0].url,
  };
  await notifyPlaylist(interaction, info, isExecute);
  return info;
};

const addQueue = (interaction, i) => {
  const info = {
    id: `${new Date().getTime()}`,
    type: 'youtube',
    title: i.videoDetails.title,
    length: i.videoDetails.lengthSeconds,
    url: i.videoDetails.video_url,
    isLive: i.videoDetails.isLiveContent,
    preview: i.videoDetails.thumbnails[0].url,
    author: interaction.user,
  };
  getQueue(interaction.guildId).songs.push(info);
  return info;
};

module.exports.searchSongs = async (interaction, isExecute, audios, login) => {
  let i = 0, intervalId = -1;
  let barString = progressBar.filledBar(audios.length, i);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(t('discord:command.play.searching.title'))
    .setDescription(`${barString[0]} [${Math.round(barString[1])}%]`);
  if (isExecute) {
    intervalId = setInterval(async () => {
      barString = progressBar.filledBar(audios.length, i);
      embed.setDescription(`${barString[0]} [${Math.round(barString[1])}%]`);
      try {
        await interaction.editReply({embeds: [embed]});
      } catch (e) {
        clearInterval(this);
        intervalId = null;
      }
    }, 1000);
  }

  let allLength = 0;
  await Promise.all(audios.map(a => ytsr(a, {
    gl: 'RU',
    hl: 'ru',
    limit: 10,
  }, options).then(async r => {
    if (r.items.length === 0) {
      throw t('inner:error.youtubeApi');
    }

    let w = 0;
    while (w < 10) {
      await ytdl.getBasicInfo(r.items[w].url, options).then(i => {
        allLength += parseInt(addQueue(interaction, i).length);
        w = 11;
      }).catch(() => {
        w++;
      });
    }
    i++;
  }))).then(async () => {
    clearInterval(intervalId);

    const remainedValue = remained(getQueue(interaction.guildId));
    getQueue(interaction.guildId).remained = (getQueue(interaction.guildId).remained ?? 0) + allLength;
    if (isExecute) {
      embed.setTitle(t('discord:command.play.shikimori.title', {login: login}))
        .setURL(`https://shikimori.one/${login}/list/anime/mylist/completed,watching/order-by/ranked`)
        .setDescription(t('discord:command.play.shikimori.description', {
          count: audios.length,
          allLength: timeFormatSeconds(allLength),
          beginIn: hasLive(getQueue(interaction.guildId))
            ? t('common:player.noRemained')
            : remainedValue === 0
              ? t('common:player.beginNow')
              : timeFormatMilliseconds(remainedValue),
        }))
        .setThumbnail('https://i.ibb.co/PGFbnkS/Afk-W8-Fi-E-400x400.png')
        .setTimestamp()
        .setFooter(t('inner:audit.command.play.shikimori', {username: interaction.user.username}), interaction.user.displayAvatarURL());
      await interaction.editReply({embeds: [embed]});
    }
    await playPlayer(interaction, isExecute);
  });
};

const notifySong = async (interaction, info, isExecute) => {
  const remainedValue = remained(getQueue(interaction.guildId));
  getQueue(interaction.guildId).remained = (getQueue(interaction.guildId).remained ?? 0) + parseInt(info.length);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(info.title))
    .setURL(info.url)
    .setDescription(t('discord:command.play.song.description', {
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
    .setFooter(t('discord:command.play.song.footer', {username: interaction.user.username}), interaction.user.displayAvatarURL());
  if (isExecute) {
    await notify('play', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.play.song'),
  });
  return info;
};

const notifyPlaylist = async (interaction, info, isExecute) => {
  const remainedValue = remained(getQueue(interaction.guildId));
  getQueue(interaction.guildId).remained = (getQueue(interaction.guildId).remained ?? 0) + parseInt(info.duration);
  const embed = new MessageEmbed()
    .setColor(config.colors.info)
    .setTitle(escaping(info.title))
    .setURL(info.url)
    .setDescription(t('discord:command.play.playlist.description', {
      count: info.length,
      allLength: timeFormatSeconds(info.duration),
      beginIn: hasLive(getQueue(interaction.guildId))
        ? t('common:player.noRemained')
        : remainedValue === 0
          ? t('common:player.beginNow')
          : timeFormatMilliseconds(remainedValue),
    }))
    .setThumbnail(info.preview)
    .setTimestamp()
    .setFooter(t('discord:command.play.playlist.footer', {username: interaction.user.username}), interaction.user.displayAvatarURL());
  if (isExecute) {
    await notify('play', interaction, {embeds: [embed]});
  }
  await audit({
    guildId: interaction.guildId,
    type: TYPES.INFO,
    category: CATEGORIES.COMMAND,
    message: t('inner:audit.command.play.playlist'),
  });
};
