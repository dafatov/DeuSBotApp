const client = require('./client');

module.exports = {
  client,
  customId: null,
  deferReply: jest.fn().mockResolvedValue(),
  fields: {
    fields: [],
  },
};
