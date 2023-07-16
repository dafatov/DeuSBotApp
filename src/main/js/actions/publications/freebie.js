const {CATEGORIES, TYPES} = require('../../db/repositories/audit');
const {ChannelType, EmbedBuilder} = require('discord.js');
const {getAll, set} = require('../../db/repositories/variables');
const {getCommandName, stringify} = require('../../utils/string');
const Parser = require('rss-parser');
const {audit} = require('../auditor');
const config = require('../../configs/config');
const {ifPromise} = require('../../utils/promises');
const last = require('lodash/last');
const {t} = require('i18next');

const RSS_URL = 'https://freesteam.ru/feed/';

module.exports = {
  content: () => new Parser({customFields: {}}).parseURL(RSS_URL)
    .then(rss => getAll()
      .then(({lastFreebie}) => rss.items
        .filter(freebie => new Date(freebie.isoDate).getTime() > new Date(lastFreebie ?? 0).getTime())
        .sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime())))
    .then(freebies => ifPromise(freebies.length > 0, () => ({
      default: {
        embeds: freebies.map(freebie =>
          new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle(freebie.title)
            .setURL(freebie.link)
            .setThumbnail(getThumbnail(freebie.categories))
            .setDescription(freebie.content)
            .setTimestamp(new Date(freebie.isoDate)),
        ),
      },
      variables: {
        lastFreebie: last(freebies)?.isoDate,
      },
    }))).catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.PUBLICIST,
      message: stringify(e),
    })),
  condition: now => Promise.resolve(now.getMinutes() % 5 === 0),
  onPublished: (messages, variables) => ifPromise(variables?.lastFreebie, () => set('lastFreebie', variables.lastFreebie))
    .then(() => Promise.all(messages
      .filter(message => message.channel.type === ChannelType.GuildNews)
      .map(message => message.crosspost())))
    .then(() => ifPromise(messages.length > 0, () => audit({
      guildId: null,
      type: TYPES.INFO,
      category: CATEGORIES.PUBLICIST,
      message: t('inner:audit.publicist.crossPost', {
        count: messages.length,
        publication: getCommandName(__filename),
      }),
    }))).catch(e => audit({
      guildId: null,
      type: TYPES.ERROR,
      category: CATEGORIES.PUBLICIST,
      message: stringify(e),
    })),
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
