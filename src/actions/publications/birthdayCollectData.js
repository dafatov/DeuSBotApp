const db = require("../../repositories/birthday");
const {MessageEmbed} = require("discord.js");
const config = require("../../configs/config");
const {log, error} = require("../../utils/logger");

module.exports = {
  async content(client) {
    const allUserIds = await db.getAllUserIds();

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
              .setTitle('Вам же не сложно?')
              .setThumbnail('https://risovach.ru/upload/2016/11/mem/tobi-maguaer-plachet_130325677_orig_.jpg')
              .setDescription(`
            - Привет, привет, приветик~, упомянутые пользователи, Вам же не сложно указать Вашу дату рождения?
            \*Для того, чтобы сделать используйте команду **/birthday set <год> <месяц> <день>**
            Если же Вы все таки твердолобы на достаточном уровне, то избежать попадание в этот список можно введя команду **/birthday ignore**\*
          `)
              .setTimestamp()
          ]
        }
      }
    }, {})))
  },
  async condition(now) {
    return now.getHours() % 6 === 0 && now.getMinutes() === 0;
  },
  async onPublished(messages, _variables) {
    try {
      setTimeout(async () => {
        await Promise.all(messages.map(m => m.delete()))
          .then(() => log('Успешно удалены публикации уведомления о днях рождений'));
      }, 900000);
    } catch (e) {
      error(e);
    }
  }
}