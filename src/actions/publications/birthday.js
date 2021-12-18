const db = require("../../repositories/birthday");
const {MessageEmbed} = require("discord.js");
const config = require("../../configs/config");
const {dateTime} = require("../../utils/dateTime");

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
              .setTitle(`Сегодня день рождения у...`)
              .setThumbnail('https://i.ibb.co/8m1FGzr/maxresdefault.png')
              .setDescription(`
            - Привет, меня зовут Deus и я бот...
            \*звучат редкие хлопки в зале\*
            - ...Мы собрались здесь, чтобы поздравить с великим днем, одним из 365 или больше других великих дней в году, но этот более особенный...
            \*слышатся смешки из зала\*
            - ...Так ладно ок. Поняли? Сегодня праздник, так что не надо портить этот день, понятно?
            \*из зала кто-то кричит\*
            - Вообще-то это ты все испортил
            - Извините, у меня такое впервые... Но это не оправдание... Короче, желаю всего наилучшего и наибольшего, но не проблем... кхе-кхе... С днюхой короче...
            \*камера показывает зал и там сид${users.length > 1 ? 'ят' : 'ит'} ${users.map(user => user.username).join(', ')}\*
          `)
              .setTimestamp()
          ]
        }
      }
    }, {})));
  },
  async condition(now) {
    return dateTime(now, 0, 0).getTime() === now.getTime();
  },
  async onPublished() {}
}