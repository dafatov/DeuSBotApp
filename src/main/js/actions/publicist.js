const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {ifPromise, throughPromise} = require('../utils/promises');
const {DISCORD_EMBEDS_MAX} = require('../utils/constants');
const {audit} = require('./auditor');
const chunk = require('lodash/chunk');
const fs = require('fs');
const {getAll} = require('../db/repositories/publicist');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

module.exports.init = client => loop(client)
  .then(() => audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.publicist'),
  }));

const loop = client => Promise.resolve(setTimeout(() => loop(client), 90000 - (new Date() % 60000)))
  .then(() => Promise.all(fs.readdirSync('./src/main/js/actions/publications')
    .filter(fileName => !fileName.startsWith('_'))
    .filter(fileName => fileName.endsWith('js'))
    .map(fileName => ({fileName, publication: require(`./publications/${fileName}`)}))
    .map(({fileName, publication}) => publication.condition(new Date())
      .then(condition => ifPromise(condition, () => publication?.content(client)
        .then(content => publish(client, content)
          .then(messages => throughPromise(messages, () =>
            content?.variables && publication.onPublished?.(messages, content.variables))))
        .then(messages => ifPromise(messages.length > 0, () => Promise.all(messages
          .map(message => audit({
            guildId: message.guildId,
            type: TYPES.INFO,
            category: CATEGORIES.PUBLICIST,
            message: t('inner:audit.publicist.published', {publication: fileName.split('.')[0]}),
          }))))))))));

const publish = (client, content) => getAll()
  .then(newsChannels => newsChannels.filter(pair => content?.[pair.guildId] ?? content?.default))
  .then(newsChannels => Promise.all(newsChannels.map(pair => client.guilds.fetch()
    .then(guilds => guilds.get(pair.guildId).fetch())
    .then(guild => guild.channels.fetch())
    .then(channels => channels.get(pair.channelId))
    .then(channel => Promise.all(chunk((content[pair.guildId] ?? content.default).embeds, DISCORD_EMBEDS_MAX)
      .map(chunkEmbeds => ({...(content[pair.guildId] ?? content.default), embeds: chunkEmbeds}))
      .map(message => channel.send(message)))))))
  .then(messagesSquared => messagesSquared
    .reduce((acc, messages) => [...acc, ...messages], []))
  .catch(error => audit({
    guildId: null,
    type: TYPES.ERROR,
    category: CATEGORIES.PUBLICIST,
    message: stringify(error),
  }));
