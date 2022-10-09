const axios = require('axios');
const {escaping} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  async getChannels() {
    const response = await axios.get('https://www.radiorecord.ru/api/stations/');
    return response.data.result.stations.map(station => (
      {
        id: station.id,
        title: station.title,
        url: station.stream_hls,
        preview: station.icon_fill_white,
      }
    ));
  },
  async getInfo(id) {
    return await getInfo(id);
  },
};

const getInfo = async id => {
  const nowPlaying = (await axios.get('https://www.radiorecord.ru/api/stations/now'))
    .data.result.find(r => r.id === id).track;

  return t('discord:radio.radioRecord.info', {artist: escaping(nowPlaying.artist), song: escaping(nowPlaying.song)});
};
