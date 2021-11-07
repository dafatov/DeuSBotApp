module.exports.init = async (client) => {
    client.queue = {
        connection: null,
        player: null,
        songs: []
    }
}