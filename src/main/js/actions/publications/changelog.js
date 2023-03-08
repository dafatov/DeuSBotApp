const {APPLICATIONS, getUnshown, shown} = require('../../db/repositories/changelog');
const {escaping, isVersionUpdated} = require('../../utils/string');
const {MessageEmbed} = require('discord.js');
const config = require('../../configs/config');
const {t} = require('i18next');

module.exports = {
  content: async () => {
    const changelogs = (await getUnshown())
      .sort((a, b) => isVersionUpdated(a.version, b.version)
        ? -1
        : 1);

    if (changelogs.length <= 0) {
      return;
    }

    return {
      default: {
        embeds: changelogs.map(changelog =>
          new MessageEmbed()
            .setColor(config.colors.info)
            .setTitle(createTitle(changelog.version, changelog.application))
            .setThumbnail('https://i.ibb.co/dK5VJcd/ancient.png')
            .setDescription(createDescription(changelog.message))
            .setTimestamp()
            .setFooter({
              text: `Copyright (c) 2021-${new Date().getFullYear()} dafatov`,
              iconURL: 'https://e7.pngegg.com/pngimages/330/725/png-clipart-computer-icons-public-key-certificate-organization-test-certificate-miscellaneous-company.png',
            }),
        ),
      },
      variables: {
        shownChangelogs: changelogs,
      },
    };
  },
  condition: () => getUnshown().then(unshowns => unshowns.length > 0),
  onPublished: async (messages, variables) => {
    if (!messages || !variables?.shownChangelogs) {
      return;
    }

    await Promise.all(messages?.map(m =>
      m.react('👍').then(() => m.react('👎')),
    ));
    await Promise.all(variables?.shownChangelogs?.map(changelog =>
      shown(changelog.version, changelog.application)));
  },
};

const createDescription = message => {
  message = JSON.parse(message);

  const getFeatures = () => message.features
    .map(feature => t('common:markItem', {item: escaping(feature)}))
    .join('\n');
  const getBugfixes = () => message.bugfixes
    .map(bugfix => t('common:markItem', {item: escaping(bugfix)}))
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
      return t('discord:embed.publicist.changelog.title.deusBot', {version: version});
    case APPLICATIONS.DEUS_BOT_APP:
      return t('discord:embed.publicist.changelog.title.deusBotWeb', {version: version});
    default:
      return t('discord:embed.publicist.changelog.title.error');
  }
};
