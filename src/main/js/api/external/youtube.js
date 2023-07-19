const {TYPES} = require('../../db/repositories/queue');
const first = require('lodash/first');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ytsr = require('ytsr');

module.exports.getPlaylist = (interaction, audio) =>
  ytpl.getPlaylistID(audio)
    .then(playlistId => ytpl(playlistId, {limit: Infinity, ...options()})
      .then(playlist => generatePlaylistInfo(interaction.user.id, playlist)));

module.exports.getSong = (interaction, audio) =>
  ytdl.getBasicInfo(audio, options())
    .then(video => generateSongInfo(interaction.user.id, video));

module.exports.getSearch = (interaction, audio) =>
  ytsr.getFilters(audio, options())
    .then(filters => filters.get('Type').get('Video').url)
    .then(url => ytsr(url, {gl: 'RU', hl: 'ru', limit: 1}, options()))
    .then(videos => ytdl.getBasicInfo(first(videos.items).url, options()))
    .then(video => generateSongInfo(interaction.user.id, video));

module.exports.getStream = url => Promise.resolve(ytdl(url, {
  ...options(),
  filter: 'audioonly',
  quality: 'highestaudio',
  highWaterMark: 1 << 25,
}));

const options = () => ({
  requestOptions: {
    headers: {
      Cookie: process.env.YOUTUBE_COOKIE,
      'x-youtube-identity-token': process.env.YOUTUBE_ID_TOKEN,
    },
  },
});

const generatePlaylistInfo = (userId, playlist) => playlist.items
  .reduce((acc, video) => ({
    info: {
      ...acc.info,
      duration: acc.info.duration + parseInt(video.durationSec),
    },
    songs: [
      ...acc.songs,
      {
        type: TYPES.YOUTUBE,
        title: video.title,
        duration: parseInt(video.durationSec),
        url: video.shortUrl,
        isLive: video.isLive,
        preview: video.bestThumbnail.url,
        userId,
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
      userId,
    },
    songs: [],
  });

const generateSongInfo = (userId, video) => ({
  info: {
    type: TYPES.YOUTUBE,
    title: video.videoDetails.title,
    duration: parseInt(video.videoDetails.lengthSeconds),
    url: video.videoDetails.video_url,
    isLive: video.videoDetails.isLiveContent,
    preview: first(video.videoDetails.thumbnails).url,
    userId,
  },
  get songs() {
    return [this.info];
  },
});
