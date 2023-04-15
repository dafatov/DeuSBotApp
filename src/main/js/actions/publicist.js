const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {DISCORD_EMBEDS_MAX} = require('../utils/constants');
const {audit} = require('./auditor');
const chunk = require('lodash/chunk');
const fs = require('fs');
const {getAll} = require('../db/repositories/publicist');
const {stringify} = require('../utils/string');
const {t} = require('i18next');
const {throughPromise} = require('../utils/promises');

module.exports.init = client => (function loop() {
  setTimeout(loop, 90000 - (new Date() % 60000));

  return Promise.all(fs.readdirSync('./src/main/js/actions/publications')
    .filter(file => !file.startsWith('_'))
    .filter(file => file.endsWith('js'))
    .map(async file => {
      const publication = require(`./publications/${file}`);

      if (await publication?.condition(new Date())) {
        const content = await publication?.content(client);

        return publish(client, content)
          .then(messages => throughPromise(messages, () =>
            content?.variables && publication.onPublished?.(messages, content.variables)))
          .then(messages => messages.map(message => message.guildId))
          .then(guildIds => {
            if (guildIds.length > 0) {
              return Promise.all(guildIds
                .map(guildId => audit({
                  guildId,
                  type: TYPES.INFO,
                  category: CATEGORIES.PUBLICIST,
                  message: t('inner:audit.publicist.published', {publication: file.split('.')[0]}),
                })));
            }
          });
      }
    }));
})()
  .then(() => audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.publicist'),
  }))
  .catch(error => audit({
    guildId: null,
    type: TYPES.ERROR,
    category: CATEGORIES.PUBLICIST,
    message: stringify(error),
  }));

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
    .reduce((acc, messages) => [...acc, ...messages], []));
