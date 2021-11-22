const { db } = require("../db.js");

let rules = new Map();

module.exports.getAll = async (guildId) => {
    if (!rules.has(guildId)) {
        const response = await db.query('SELECT regex, react FROM RESPONSE WHERE guild_id=$1', [guildId]);
        rules.set(guildId, response.rows || []);
    }
    return rules.get(guildId);
}

module.exports.set = async (guildId, {regex, react}) => {
    await this.delete(guildId, regex);
    await db.query('INSERT INTO RESPONSE (guild_id, regex, react) VALUES ($1, $2, $3)', [guildId, regex, react]);
}

module.exports.delete = async (guildId, regex) => {
    rules.delete(guildId);
    await db.query('DELETE FROM RESPONSE WHERE guild_id=$1 AND regex=$2', [guildId, regex]);
}

module.exports.count = async () => {
    return await db.query('SELECT guild_id, COUNT(*) FROM RESPONSE GROUP BY guild_id')
}