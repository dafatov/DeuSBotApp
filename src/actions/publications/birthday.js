const {MessageEmbed} = require('discord.js');
const config = require('../../configs/config');
const db = require('../../db/repositories/birthday');
const {t} = require('i18next');

module.exports = {
  async content(client) {
    const todayBirthdays = await db.getTodayBirthdays();

    if (todayBirthdays.length <= 0) {
      return;
    }

    return client.guilds.fetch()
      .then(guilds => guilds.reduce((acc, guild) => guild.fetch()
        .then(guild => guild.members.fetch({user: todayBirthdays.map(b => b.userId)}))
        .then(members => members.map(member => member.user))
        .then(users => guild.fetch()
          .then(guild => ({
            ...acc,
            [guild.id]: {
              content: '@here',
              embeds: [
                new MessageEmbed()
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
            }
          }))
        )
      ), {});
  },
  condition(now) {
    return now.getHours() === 18 && now.getMinutes() === 0;
  },
};
