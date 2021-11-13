const { log } = require('../utils/logger.js');

module.exports.init = async (client) => {
    client.queue = {
        connection: null,
        voiceChannel: null,
        player: null,
        nowPlaying: null,
        songs: []
    }
    log(`Успешно зарегистрирован плеер`)
}