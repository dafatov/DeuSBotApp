const {getAll} = require("../repositories/publicist");
const {log} = require("../utils/logger.js");
const fs = require('fs');
const {error} = require("../utils/logger");

let client;

module.exports.init = async (c) => {
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
                log(`Успешно опубликована новость \"${f.split('.')[0]}\" для для гильдий: [${
                  await Promise.all(messages.map(m => client.guilds.fetch()
                    .then(guilds => guilds.get(m.guildId).fetch())
                  )).then(gs => gs.map(g => g.name).sort().join(', '))
                }]`);
              });
            }
          }
          setTimeout(loop, 60000 - (new Date() % 60000));
        })();
      })
  ).then(() => log('Успешно зарегестрирован публицист'))
}

const publish = async (content) => {
  // const newsChannels = [{guildId: '905052154027475004', channelId: '911212955905966120'}];
  const newsChannels = await getAll();

  return Promise.all(newsChannels
    .filter(pair => content[pair.guildId] ?? content.default)
    .map(async pair => client.guilds.fetch()
      .then(guilds => guilds.get(pair.guildId).fetch())
      .then(guild => guild.channels.fetch())
      .then(channels => channels.get(pair.channelId))
      .then(channel => channel.send(content[pair.guildId] ?? content.default))
      .catch(e => error(e))
    ));
}