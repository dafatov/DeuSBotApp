const axios = require("axios");
const {escaping} = require("../../utils/string");

module.exports = {
  async getChannels() {
    const response = await axios.get('https://www.radiorecord.ru/api/stations/');
    return response.data.result.stations.map(station => (
      {
        id: station.id,
        title: station.title,
        url: station.stream_hls.replace('playlist.m3u8', '96/playlist.m3u8'),
        preview: station.icon_fill_white
      }
    ))
  },
  async getInfo(id) {
    return await getInfo(id);
  }
}

const getInfo = async (id) => {
  const nowPlaying = (await axios.get('https://www.radiorecord.ru/api/stations/now'))
    .data.result.find(r => r.id === id).track;

  return `
    Источник: **${escaping(nowPlaying.artist)}**
    Композиция: **${escaping(nowPlaying.song)}**
  `;
}