const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {DISCORD_EMBEDS_MAX} = require('../utils/constants');
const {audit} = require('./auditor');
const {chunk} = require('../utils/array');
const fs = require('fs');
const {getAll} = require('../db/repositories/publicist');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

module.exports.init = async client => {
  await Promise.all(
    fs.readdirSync('./src/main/js/actions/publications')
      .filter(f => !f.startsWith('_'))
      .filter(f => f.endsWith('js'))
      .map(f => {
        const publication = require(`./publications/${f}`);
        return (async function loop() {
          if (await publication.condition(new Date())) {
            try {
              const content = await publication.content(client);

              if (content) {
                await publish(client, content).then(messages => {
                  publication.onPublished?.(messages, content?.variables);
                  return messages;
                }).then(async messages => {
                  const guilds = await Promise.all(messages.map(m => m.guild));
                  if (guilds.length > 0) {
                    await Promise.all(guilds.map(guild => audit({
                      guildId: guild.id,
                      type: TYPES.INFO,
                      category: CATEGORIES.PUBLICIST,
                      message: t('inner:audit.publicist.published', {publication: f.split('.')[0]}),
                    })));
                  }
                });
              }
            } catch (error) {
              await audit({
                guildId: null,
                type: TYPES.ERROR,
                category: CATEGORIES.PUBLICIST,
                message: stringify(error),
              });
            }
          }
          setTimeout(loop, 90000 - (new Date() % 60000));
        })();
      }),
  ).then(() => audit({
    guildId: null,
    type: TYPES.INFO,
    category: CATEGORIES.INIT,
    message: t('inner:audit.init.publicist'),
  }));
};

const publish = (client, content) => getAll()
  .then(newsChannels => newsChannels.filter(pair => content[pair.guildId] ?? content.default))
  .then(newsChannels => Promise.all(newsChannels.map(pair => client.guilds.fetch()
    .then(guilds => guilds.get(pair.guildId).fetch())
    .then(guild => guild.channels.fetch())
    .then(channels => channels.get(pair.channelId))
    .then(channel => Promise.all(chunk((content[pair.guildId] ?? content.default).embeds, DISCORD_EMBEDS_MAX)
      .map(chunkEmbeds => ({...(content[pair.guildId] ?? content.default), embeds: chunkEmbeds}))
      .map(message => channel.send(message)))))))
  .then(messagesSquared => messagesSquared
    .reduce((acc, messages) => [...acc, ...messages], []))
  .catch(e => audit({
    guildId: null,
    type: TYPES.ERROR,
    category: CATEGORIES.PUBLICIST,
    message: stringify(e),
  }));
