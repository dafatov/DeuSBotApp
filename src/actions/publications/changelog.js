const {MessageEmbed} = require('discord.js');
const config = require('../../configs/config');
const {escaping, isVersionUpdated} = require('../../utils/string');
const {getUnshown, shown, APPLICATIONS} = require('../../db/repositories/changelog');

module.exports = {
  async content(_client) {
    const changelogs = (await getUnshown())
      .sort((a, b) => isVersionUpdated(a.version, b.version)
        ? -1
        : 1);

    return {
      default: {
        content: null,
        embeds: changelogs.map(changelog =>
          new MessageEmbed()
            .setColor(config.colors.info)
            .setTitle(createTitle(changelog.version, changelog.application))
            .setThumbnail('https://i.ibb.co/dK5VJcd/ancient.png')
            .setDescription(createDescription(changelog.message))
            .setTimestamp()
            .setFooter(
              'Copyright (c) 2021-2022 dafatov',
              'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
            ),
        ),
        files: [],
        components: [],
      },
      variables: {
        shownChangelogs: changelogs,
      },
    };
  },
  async condition(_now) {
    return (await getUnshown()).length > 0;
  },
  async onPublished(messages, variables) {
    await Promise.all(messages.map(m =>
      m.react('👍').then(() => m.react('👎')),
    ));
    await Promise.all(variables.shownChangelogs.map(changelog =>
      shown(changelog.version, changelog.application)));
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

const createTitle = (version, application) => {
  switch (application) {
    case APPLICATIONS.DEUS_BOT:
      return `DeuS обновился! Изменения в v${version}:`;
    case APPLICATIONS.DEUS_BOT_APP:
      return `Сайт DeuS'а обновился! Изменения в v${version}:`;
    default:
      return `[Ошибка] Просьба связаться с администрацией`;
  }
};
