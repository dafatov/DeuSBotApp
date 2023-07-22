const user = require('./user');

module.exports = {
  displayName: user.username,
  get guild() {
    return require('./guild');
  },
  user,
  get voice() {
    return {
      channelId: '343847059612237824',
      guild: this.guild,
      get channel() {
        return {
          id: this.channelId,
          guildId: this.guild.id,
          guild: this.guild,
          name: 'Осенний кринж',
        };
      },
    };
  },
};
