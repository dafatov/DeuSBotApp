// eslint-disable-next-line filenames/match-regex
const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {MessageEmbed} = require('discord.js');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const db = require('../../db/repositories/birthday');
const {stringify} = require('../../utils/string');
const {t} = require('i18next');

module.exports = {
  async content(client) {
    const allUserIds = (await db.getAll())
      .filter(b => b.date || b.ignored)
      .map(b => b.user_id);

    return (await ((await client.guilds.fetch()).reduce(async (accumulator, guild) => {
      const users = (await (await guild.fetch()).members.fetch())
        .map(m => m.user)
        .filter(u => !allUserIds.includes(u.id))
        .filter(u => !u.bot);

      if (users.length <= 0) {
        return accumulator;
      }

      return {
        //Без await не работает, так как функция в которой все происходит async
        ...(await accumulator),
        [(await guild.fetch()).id]: {
          content: users.map(user => `<@${user.id}>`).join(''),
          embeds: [
            new MessageEmbed()
              .setColor(config.colors.info)
              .setTitle(t('discord:embed.publicist.birthdayCollectData.title'))
              .setThumbnail('https://risovach.ru/upload/2016/11/mem/tobi-maguaer-plachet_130325677_orig_.jpg')
              .setDescription(t('discord:embed.publicist.birthdayCollectData.description'))
              .setTimestamp(),
          ],
        },
      };
    }, {})));
  },
  condition(now) {
    return now.getHours() % 6 === 0 && now.getMinutes() === 0;
  },
  async onPublished(messages) {
    try {
      setTimeout(async () => {
        await Promise.all(messages.map(m => m.delete()))
          .then(() => audit({
            guildId: null,
            type: TYPES.INFO,
            category: CATEGORIES.PUBLICIST,
            message: t('inner:audit.publicist.birthdayCollectData.removed'),
          }));
      }, 900000);
    } catch (e) {
      await audit({
        guildId: null,
        type: TYPES.ERROR,
        category: CATEGORIES.PUBLICIST,
        message: stringify(e),
      });
    }
  },
};
