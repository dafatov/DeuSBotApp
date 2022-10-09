const {escaping, parseAnisonResponseOnAir} = require('../../utils/string.js');
const axios = require('axios').default;
const {t} = require('i18next');
const {timeFormatSeconds} = require('../../utils/dateTime');

module.exports = {
  getChannels() {
    return [
      {
        id: 0,
        title: 'AniSon.FM',
        url: 'https://pool.anison.fm/AniSonFM(320)',
        preview: 'https://i.ibb.co/8c973V3/3-Nm-m-Sp-AMVc.jpg',
      },
    ];
  },
  async getInfo(id) {
    return await getInfo(id);
  },
};

const getInfo = async () => {
  const response = await axios.get('https://anison.fm/status.php?widget=true');
  const onAir = parseAnisonResponseOnAir(response.data.on_air);

  return t('discord:radio.anisonFm.info', {source: escaping(onAir.source), song: escaping(onAir.title), duration: timeFormatSeconds(response.data.duration)});
};
