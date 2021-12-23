const {MessageEmbed} = require("discord.js");
const config = require("../../configs/config");
const Parser = require("rss-parser");
const variablesDb = require("../../repositories/variables");
const {log, error} = require("../../utils/logger");

const RSS_URL = 'https://freesteam.ru/feed/';

module.exports = {
  async content(_client) {
    const rss = await new Parser({customFields: {}}).parseURL(RSS_URL);
    const lastFreebie = (await variablesDb.getAll())?.lastFreebie;
    const freebies = rss.items
      .filter(f => new Date(f.isoDate).getTime() > (new Date(lastFreebie ?? 0)))
      .sort((a, b) => new Date(a.isoDate).getTime() < new Date(b.isoDate).getTime() ? -1 : 1)
      .slice(0, 10);

    if (freebies.length <= 0) {
      return;
    }

    return {
      default: {
        content: null,
        embeds: freebies.map(f =>
          new MessageEmbed()
            .setColor(config.colors.info)
            .setTitle(f.title)
            .setThumbnail(getThumbnail(f.categories))
            .setDescription(f.content)
            .setTimestamp(new Date(f.isoDate))
        )
      },
      variables: {
        lastFreebie: freebies[freebies.length - 1]?.isoDate
      }
    }
  },
  async condition(now) {
    return now.getMinutes() % 5 === 0;
  },
  async onPublished(messages, variables) {
    if (variables?.lastFreebie) {
      await variablesDb.set('lastFreebie', variables.lastFreebie);
    }
    Promise.all(messages.map(message => {
      if (message.channel.type === 'GUILD_NEWS') {
        return message.crosspost()
      }
    })).then(() => log("Успешно разослана публикация \"freebie\" на подписанные каналы"))
      .catch((e) => error(e))
  }
}

const getThumbnail = (categories) => {
  if (categories.includes('Epic Games')) {
    return 'https://w7.pngwing.com/pngs/531/238/png-transparent-epic-games-gears-of-war-exile-fortnite-unreal-engine-4-unreal-tournament-epic-games-emblem-logo-video-game-thumbnail.png';
  } else if (categories.includes('Steam')) {
    return 'https://n7.nextpng.com/sticker-png/244/323/sticker-png-steam-gift-card-video-game-valve-corporation-gift-miscellaneous-game-logo-video-game-thumbnail.png';
  } else {
    return 'https://static10.tgstat.ru/channels/_0/0c/0c75b8bf567806a342839cb1a406f4f8.jpg';
  }
}