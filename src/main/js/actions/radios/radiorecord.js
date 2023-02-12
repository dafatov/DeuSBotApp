const axios = require('axios');
const {escaping} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  getChannels: () => axios.get('https://www.radiorecord.ru/api/stations')
    .then(response => response.data.result.stations
      .map(station => ({
        id: station.id,
        title: station.title,
        url: station.stream_320,
        preview: station.icon_fill_white,
      }))),
  getInfo: id => getInfo(id),
};

const getInfo = async id => {
  const nowPlaying = (await axios.get('https://www.radiorecord.ru/api/stations/now')).data.result
    .find(r => r.id === id).track;

  return t('discord:radio.radioRecord.info', {artist: escaping(nowPlaying.artist), song: escaping(nowPlaying.song)});
};
