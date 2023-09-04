const {EmbedBuilder} = require('discord.js');
const config = require('../../configs/config');
const {getTodayBirthdayUserIds} = require('../../db/repositories/birthday');
const {ifPromise} = require('../../utils/promises');
const {isExactlyTime} = require('../../utils/dateTime');
const {t} = require('i18next');

module.exports = {
  content: client => getTodayBirthdayUserIds()
    .then(todayBirthdayUserIds => ifPromise(todayBirthdayUserIds.length > 0, () => client.guilds.fetch()
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
            })))), Promise.resolve({}))), () => Promise.resolve({}))),
  condition: now => Promise.resolve(isExactlyTime(now, 18, 0)),
};
