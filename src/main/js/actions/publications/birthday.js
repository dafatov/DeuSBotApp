const {EmbedBuilder} = require('discord.js');
const config = require('../../configs/config');
const db = require('../../db/repositories/birthday');
const {isExactlyTime} = require('../../utils/dateTime');
const {t} = require('i18next');

module.exports = {
  content: async client => {
    const todayBirthdayUserIds = await db.getTodayBirthdayUserIds();

    if (todayBirthdayUserIds.length <= 0) {
      return;
    }

    return client.guilds.fetch()
      .then(guilds => guilds.reduce((accPromise, guild) => guild.fetch()
        .then(guild => guild.members.fetch({user: todayBirthdayUserIds})
          .then(members => members.map(member => member.user))
          .then(users => accPromise
            .then(acc => ({
              ...acc,
              [guild.id]: {
                content: '@here',
                embeds: [
                  new EmbedBuilder()
                    .setColor(config.colors.info)
                    .setTitle(t('discord:embed.publicist.birthday.title'))
                    .setThumbnail('https://i.ibb.co/8m1FGzr/maxresdefault.png')
                    .setDescription(t(
                      'discord:embed.publicist.birthday.description', {
                        ending: users.length > 1
                          ? 'ят'
                          : 'ит',
                        users: users.map(user => `<@${user.id}>`),
                      }))
                    .setTimestamp(),
                ],
              },
            })))), Promise.resolve({})));
  },
  condition: now => isExactlyTime(now, 18, 0),
};
