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

    return (await ((await client.guilds.fetch()).reduce(async (object, guild) => {
      const users = (await (await guild.fetch()).members.fetch({user: todayBirthdays.map(b => b.userId)})).map(m => m.user);

      return {
        //Без await не работает, так как функция в которой все происходит async
        ...(await object),
        [(await guild.fetch()).id]: {
          content: users.map(user => `<@${user.id}>`).join(', '),
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
                  users: users.map(user => user.username),
                }))
              .setTimestamp(),
          ],
        },
      };
    }, {})));
  },
  condition(now) {
    return now.getHours() === 18 && now.getMinutes() === 0;
  },
};
