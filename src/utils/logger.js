const {CATEGORIES, TYPES} = require('../db/repositories/audit');
const {audit} = require('../actions/auditor');

/**
 * @deprecated
 * @param guildId
 * @param msg
 */
module.exports.logGuild = (guildId, msg) => {
  audit({guildId, type: TYPES.INFO, category: CATEGORIES.UNCATEGORIZED, message: msg});
};

/**
 * @deprecated
 * @param msg
 */
module.exports.error = msg => {
  audit({guildId: null, type: TYPES.ERROR, category: CATEGORIES.UNCATEGORIZED, message: msg});
};
