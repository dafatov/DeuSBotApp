const {MessageEmbed} = require('discord.js');
const config = require('../../configs/config');
const db = require('../../repositories/changelog');
const {escaping} = require('../../utils/string');

module.exports = {
  async content(_client) {
    const changelog = await db.getLast();

    return {
      default: {
        content: null,
        embeds: [
          new MessageEmbed()
            .setColor(config.colors.info)
            .setTitle(`DeuS обновился! Изменения в v${changelog.version}:`)
            .setThumbnail('https://i.ibb.co/dK5VJcd/ancient.png')
            .setDescription(createDescription(changelog.message))
            .setTimestamp()
            .setFooter(
              'Copyright (c) 2021-2022 dafatov',
              'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
            ),
        ],
        files: [],
        components: [],
      },
    };
  },
  async condition(_now) {
    return !((await db.getLast())?.shown ?? true);
  },
  async onPublished(messages, _variables) {
    await Promise.all(messages.map(m =>
      m.react('👍').then(() => m.react('👎')),
    ));
    await db.shown((await db.getLast()).version);
  },
};

const createDescription = (message) => {
  message = JSON.parse(message);

  const getFeatures = () => message.features
    .map(feature => `\t- ${escaping(feature)}`)
    .join('\n');
  const getBugfixes = () => message.bugfixes
    .map(bugfix => `\t- ${escaping(bugfix)}`)
    .join('\n');

  const parts = [
    message.ad && `_${escaping(message.ad)}_\n`,
    message.announce && `\`\`\`\n${escaping(message.announce)}\n\`\`\``,
    message.features.length > 0 && `\n**Нововведения:**\n${getFeatures()}\n`,
    message.bugfixes.length > 0 && `**Исправления:**\n${getBugfixes()}\n`,
    message.footer && `\n_${escaping(message.footer)}_`,
  ];

  return ''.concat(...parts.filter(p => p));
};
