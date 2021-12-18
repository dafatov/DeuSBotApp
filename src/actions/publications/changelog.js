const {MessageEmbed} = require("discord.js");
const config = require("../../configs/config");
const db = require("../../repositories/changelog");

module.exports = {
  async content(_client) {
    const last = await db.getLast();

    return {
      default: {
        content: null,
        embeds: [
          new MessageEmbed()
            .setColor(config.colors.info)
            .setTitle(`DeuS обновился! Изменения в v${last.version}:`)
            .setThumbnail('https://i.ibb.co/dK5VJcd/ancient.png')
            .setDescription(last.description)
            .setTimestamp()
            .setFooter('Copyright (c) 2021 dafatov',
              'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png')
        ],
        files: [],
        components: []
      }
    }
  },
  async condition(_now) {
    return !((await db.getLast())?.shown ?? true);
  },
  async onPublished() {
    await db.shown((await db.getLast()).version);
  }
}