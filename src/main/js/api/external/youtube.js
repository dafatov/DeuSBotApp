const {options} = require('../../actions/player');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');

module.exports.getPlaylist = (interaction, audio) =>
  ytpl.getPlaylistID(audio)
    .then(playlistId => ytpl(playlistId, {limit: Infinity, ...options()})
      .then(playlist => generatePlaylistInfo(interaction.user, playlist)));

module.exports.getSong = (interaction, audio) =>
  ytdl.getBasicInfo(audio, options())
    .then(video => generateSongInfo(interaction.user, video));

module.exports.getSearch = (interaction, audio) =>
  ytsr.getFilters(audio, options())
    .then(filters => filters.get('Type').get('Video').url)
    .then(url => ytsr(url, {gl: 'RU', hl: 'ru', limit: 1}, options()))
    .then(videos => ytdl.getBasicInfo(videos.items[0].url, options()))
    .then(video => generateSongInfo(interaction.user, video));

const generatePlaylistInfo = (user, playlist) => playlist.items.reduce((acc, video, index) => ({
  info: {
    ...acc.info,
    duration: acc.info.duration + parseInt(video.durationSec),
  },
  songs: [
    ...(acc.songs ?? []),
    {
      id: `${new Date().getTime()}-${index}`,
      type: 'youtube',
      title: video.title,
      duration: parseInt(video.durationSec),
      url: video.shortUrl,
      isLive: video.isLive,
      preview: video.bestThumbnail.url,
      author: {
        username: user.username,
        iconURL: user.displayAvatarURL(),
      },
    },
  ],
}), {
  info: {
    title: playlist.title,
    length: playlist.items.length,
    duration: 0,
    url: playlist.url,
    isLive: playlist.items.some(video => video.isLive),
    preview: playlist.bestThumbnail.url,
    author: {
      username: user.username,
      iconURL: user.displayAvatarURL(),
    },
  },
});

const generateSongInfo = (user, video) => ({
  info: {
    id: `${new Date().getTime()}`,
    type: 'youtube',
    title: video.videoDetails.title,
    duration: parseInt(video.videoDetails.lengthSeconds),
    url: video.videoDetails.video_url,
    isLive: video.videoDetails.isLiveContent,
    preview: video.videoDetails.thumbnails[0].url,
    author: {
      username: user.username,
      iconURL: user.displayAvatarURL(),
    },
  },
  get songs() {
    return [this.info];
  },
});
