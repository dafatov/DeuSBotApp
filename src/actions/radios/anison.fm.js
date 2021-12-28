const axios = require('axios').default;
const {parseAnisonResponseOnAir, escaping} = require("../../utils/string.js");
const {timeFormatSeconds} = require("../../utils/dateTime");

module.exports = {
  async getChannels() {
    return [
      {
        id: 0,
        title: 'AniSon.FM',
        url: 'https://pool.anison.fm/AniSonFM(320)',
        preview: 'https://i.ibb.co/8c973V3/3-Nm-m-Sp-AMVc.jpg',
      },
    ]
  },
  async getInfo(id) {
    return await getInfo(id);
  }
}

const getInfo = async (_id) => {
  const response = await axios.get('https://anison.fm/status.php?widget=true');
  const onAir = parseAnisonResponseOnAir(response.data.on_air);

  return `
    Источник: **${escaping(onAir.source)}**
    Композиция: **${escaping(onAir.title)}**
    Осталось: **${timeFormatSeconds(response.data.duration)}**
  `;
}