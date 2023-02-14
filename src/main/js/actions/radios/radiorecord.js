const axios = require('axios');
const {escaping} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  getChannels: () => axios.get('https://www.radiorecord.ru/api/stations')
    .then(response => response.data.result?.stations
      .map(station => ({
        id: station.id,
        title: station.title,
        url: station.stream_320,
        preview: station.icon_fill_white,
      }))),
  getInfo: id => axios.get('https://www.radiorecord.ru/api/stations/now')
    .then(response => response.data.result
      .find(track => track.id === id).track)
    .then(track => t('discord:radio.radioRecord.info', {artist: escaping(track.artist), song: escaping(track.song)}))
    .catch(() => t('discord:radio.radioRecord.error')),
};
