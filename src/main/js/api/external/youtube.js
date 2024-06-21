const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {ifPromise, throughThrow} = require('../../utils/promises');
const {TYPES: SONG_TYPES} = require('../../db/repositories/queue');
const {audit} = require('../../actions/auditor');
const axios = require('axios');
const first = require('lodash/first');
const {stringify} = require('../../utils/string');
const {youtubeDurationToSeconds} = require('../../utils/dateTime');
const ytdl = require('ytdl-core');

module.exports.getPlaylist = (interaction, audio) =>
  getPlaylistId(audio)
    .then(id => axios.get(`${process.env.YOUTUBE_API_URL}/playlists?${new URLSearchParams({
      id,
      key: process.env.YOUTUBE_API_KEY,
      part: ['snippet', 'contentDetails'],
    })}`).then(response => response.data)
      .then(data => first(data.items))
      .then(playlist => fillPlaylist(interaction, {
        info: {
          title: playlist.snippet.localized.title,
          length: playlist.contentDetails.itemCount,
          duration: 0,
          url: `${process.env.YOUTUBE_URL}/playlist?list=${playlist.id}`,
          isLive: false,
          preview: getPreview(playlist.snippet.thumbnails),
          userId: interaction.user.id,
        },
        songs: [],
      }, playlist.id))
      .catch(e => throughThrow(e, audit({
        guildId: interaction.guildId,
        type: TYPES.ERROR,
        category: CATEGORIES.API,
        message: stringify(e),
      }))));

module.exports.getSong = (interaction, audio) =>
  getVideoId(audio)
    .then(id => getVideo(interaction, id)
      .catch(e => throughThrow(e, audit({
        guildId: interaction.guildId,
        type: TYPES.ERROR,
        category: CATEGORIES.API,
        message: stringify(e),
      }))));

module.exports.getSearch = (interaction, audio) =>
  axios.get(`${process.env.YOUTUBE_API_URL}/search?${new URLSearchParams({
    maxResults: 1,
    relevanceLanguage: 'ru',
    type: 'video',
    key: process.env.YOUTUBE_API_KEY,
    q: audio,
  })}`).then(response => response.data)
    .then(data => first(data.items))
    .then(video => ifPromise(video, () => getVideo(interaction, video.id.videoId)));

module.exports.getStream = url => Promise.resolve(ytdl(url, {
  ...options(),
  filter: 'audioonly',
  quality: 'highestaudio',
  highWaterMark: 1 << 25,
}));

const fillPlaylist = async (interaction, playlist, playlistId) => {
  let pageToken = '';

  // eslint-disable-next-line no-loops/no-loops
  do {
    const data = await axios.get(`${process.env.YOUTUBE_API_URL}/playlistItems?${new URLSearchParams({
      playlistId,
      key: process.env.YOUTUBE_API_KEY,
      maxResults: 50,
      part: 'contentDetails',
      pageToken,
    })}`).then(response => response.data);

    playlist = await Promise.all(data.items.map(item => getVideo(interaction, item.contentDetails.videoId)))
      .then(videos => videos
        .filter(r => r)
        .reduce((acc, item) => ({
          info: {
            ...acc.info,
            duration: acc.info.duration + item.info.duration,
            isLive: item.info.isLive
              ? true
              : acc.info.isLive,
          },
          songs: [
            ...acc.songs,
            item.info,
          ],
        }), playlist));

    pageToken = data.nextPageToken;
  } while (pageToken);

  return playlist;
};

const getVideo = (interaction, id) =>
  axios.get(`${process.env.YOUTUBE_API_URL}/videos?${new URLSearchParams({
    id,
    key: process.env.YOUTUBE_API_KEY,
    part: ['snippet', 'contentDetails'],
  })}`).then(reponse => reponse.data)
    .then(data => first(data.items))
    .then(video => video
      ? ({
        info: {
          type: SONG_TYPES.YOUTUBE,
          title: video.snippet.localized.title,
          duration: youtubeDurationToSeconds(video.contentDetails.duration),
          url: `${process.env.YOUTUBE_URL}/watch?v=${video.id}`,
          isLive: video.snippet.liveBroadcastContent === 'live',
          preview: getPreview(video.snippet.thumbnails),
          userId: interaction.user.id,
        },
        get songs() {
          return [this.info];
        },
      })
      : null);

const getPreview = thumnails =>
  (thumnails.maxres ?? thumnails.standard ?? thumnails.high).url;

const options = () => ({
  requestOptions: {
    headers: {
      Cookie: process.env.YOUTUBE_COOKIE,
      'x-youtube-identity-token': process.env.YOUTUBE_ID_TOKEN,
    },
  },
});

const getVideoId = url => new Promise((resolve, reject) => {
  const videoId = url
    .match(/^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/)
    ?.[1];

  videoId
    ? resolve(videoId)
    : reject();
});

const getPlaylistId = url => new Promise((resolve, reject) => {
  const playlistId = url
    .match(/^(?:(?:https?:)?\/\/)?(?:www\.)?youtube\.com\/playlist\?list=(\w+|-)+$/)
    ?.[1];

  playlistId
    ? resolve(playlistId)
    : reject();
});
