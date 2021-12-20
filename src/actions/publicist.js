const {getAll} = require("../repositories/publicist");
const {log} = require("../utils/logger.js");
const fs = require('fs');

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

            await publish(f.split('.')[0], content)
              .then(() => publication.onPublished(content?.variables));
          }
          setTimeout(loop, 60000 - (new Date() % 60000));
        })();
      })
  )
  log('Успешно зарегестрирован публицист');
}

const publish = async (name, content) => {
  if (!content) {
    return;
  }
  // const news_channels = [{guildId: '905052154027475004', channelId: '921119789286576188'}]
  const news_channels = await getAll();

  news_channels.forEach(pair => {
    client.guilds.cache.get(pair.guildId).channels.cache.get(pair.channelId).send(content[pair.guildId] ?? content.default);
  });
  log(`Успешно опубликована новость \"${name}\" для для гильдий: [${news_channels.map(g =>
    client.guilds.cache.get(g.guildId).name).sort().join(', ')}]`)
}