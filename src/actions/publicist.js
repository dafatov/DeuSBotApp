const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('./auditor');
const fs = require('fs');
const {getAll} = require('../db/repositories/publicist');
const {stringify} = require('../utils/string');
const {t} = require('i18next');

let client;

module.exports.init = async c => {
  client = c;

  await Promise.all(
    fs.readdirSync('./src/actions/publications')
      .filter(f => !f.startsWith('_'))
      .filter(f => f.endsWith('js'))
      .map(f => {
        const publication = require(`./publications/${f}`);
        return (async function loop() {
          if (await publication.condition(new Date())) {
            const content = await publication.content(client);

            if (content) {
              await publish(content).then(messages => {
                publication.onPublished(messages, content?.variables);
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

const publish = async content => {
  const newsChannels = await getAll();

  return Promise.all(newsChannels
    .filter(pair => content[pair.guildId] ?? content.default)
    .map(pair => client.guilds.fetch()
      .then(guilds => guilds.get(pair.guildId).fetch())
      .then(guild => guild.channels.fetch())
      .then(channels => channels.get(pair.channelId))
      .then(channel => channel.send(content[pair.guildId] ?? content.default))
      .catch(e => audit({
        guildId: null,
        type: TYPES.ERROR,
        category: CATEGORIES.PUBLICIST,
        message: stringify(e),
      })),
    ));
};
