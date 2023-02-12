const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {MessageEmbed} = require('discord.js');
const Parser = require('rss-parser');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {stringify} = require('../../utils/string');
const {t} = require('i18next');
const variablesDb = require('../../db/repositories/variables');

const RSS_URL = 'https://freesteam.ru/feed/';

module.exports = {
  async content() {
    try {
      const rss = await new Parser({customFields: {}}).parseURL(RSS_URL);
      const lastFreebie = (await variablesDb.getAll())?.lastFreebie;
      const freebies = rss.items
        .filter(f => new Date(f.isoDate).getTime() > (new Date(lastFreebie ?? 0).getTime()))
        .sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime())
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
              .setTimestamp(new Date(f.isoDate)),
          ),
        },
        variables: {
          lastFreebie: freebies[freebies.length - 1]?.isoDate,
        },
      };
    } catch (e) {
      await audit({
        guildId: null,
        type: TYPES.ERROR,
        category: CATEGORIES.PUBLICIST,
        message: stringify(e),
      });
    }
  },
  condition(now) {
    return now.getMinutes() % 5 === 0;
  },
  async onPublished(messages, variables) {
    if (variables?.lastFreebie) {
      await variablesDb.set('lastFreebie', variables.lastFreebie);
    }
    Promise.all(messages.map(message => {
      if (message.channel.type === 'GUILD_NEWS') {
        return message.crosspost();
      }
    })).then(() => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.PUBLICIST,
      message: t('inner:audit.publicist.crossPost', {publication: 'freebie'}),
    })).catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.PUBLICIST,
      message: stringify(e),
    }));
  },
};

const getThumbnail = categories => {
  if (categories.includes('Epic Games')) {
    return 'https://img.icons8.com/nolan/512/epic-games.png';
  } else if (categories.includes('Steam')) {
    return 'https://workinnet.ru/wp-content/uploads/2022/06/steam_logo-1024x1024.png';
  } else if (categories.includes('GOG')) {
    return 'https://i.imgur.com/BLhrDmX.png';
  } else {
    return 'https://static10.tgstat.ru/channels/_0/0c/0c75b8bf567806a342839cb1a406f4f8.jpg';
  }
};
