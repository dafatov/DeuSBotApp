const {t} = require('i18next');

module.exports.generateInteraction = member => {
  return new Promise((resolve, reject) => {
    if (member) {
      resolve({
        user: member.user,
        guildId: member.guild.id,
        member,
      });
    } else {
      reject({result: t('inner:server.status.wrongVoiceChannel')});
    }
  });
};
