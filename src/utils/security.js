const axios = require("axios");
const {getQueue} = require("../actions/player");

module.exports.authForUserId = (token) =>
  axios.get('https://discord.com/api/users/@me', {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Bearer ${token}`
    }
  }).then(r => r.data.id)

//TODO добавить throw exception когда пользователь не в том канале
module.exports.authForVoiceMember = (token, client) =>
  this.authForUserId(token)
    .then(userId => client.guilds.fetch()
      .then(guilds => Promise.all(guilds.map(g => g.fetch()
        .then(guild => guild.members.fetch()
          .then(members => members.find(member => member.user.id === userId))))))
      .then(members => members.find(member => member.voice.channelId)))

module.exports.authForNowPlaying = (token, client) =>
  this.authForVoiceMember(token, client)
    .then(member => member.guild.id)
    .then(guildId => getQueue(guildId))
    .then(queue => queue.nowPlaying?.song ? {
      song: {
        ...queue.nowPlaying?.song ?? {},
        playbackDuration: queue.nowPlaying?.resource?.playbackDuration ?? 0
      },
      isPause: queue.nowPlaying?.isPause ?? false,
      isLoop: queue.nowPlaying?.isLoop ?? false
    } : {})

module.exports.authForSongs = (token, client) =>
  this.authForVoiceMember(token, client)
    .then(member => member.guild.id)
    .then(guildId => getQueue(guildId).songs ?? [])