const client = require('./client');
const user = require('./user');

module.exports = {
  client,
  customId: null,
  deferReply: jest.fn().mockResolvedValue(),
  fields: {
    getTextInputValue: jest.fn(),
    fields: [],
  },
  user,
};
