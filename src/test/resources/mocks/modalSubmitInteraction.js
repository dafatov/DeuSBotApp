const client = require('./client');
const user = require('./user');

module.exports = {
  client,
  customId: null,
  deferReply: jest.fn(),
  fields: {
    getTextInputValue: jest.fn(),
    fields: [],
  },
  user,
};
