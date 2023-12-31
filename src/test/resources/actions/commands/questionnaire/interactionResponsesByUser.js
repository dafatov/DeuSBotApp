const user = require('../../../mocks/user');

module.exports = {
  [user.id]: {
    interaction: {
      customId: 'optionButton_1',
      user,
    }
  },
  '233923369685352449': {
    interaction: {
      customId: 'optionButton_1',
      user: {
        id: '233923369685352449',
        toString: () => '@<233923369685352449>',
      }
    }
  },
  '381845173384249356': {
    interaction: {
      customId: 'optionButton_0',
      user: {
        id: '381845173384249356',
        toString: () => '@<381845173384249356>',
      }
    }
  }
};
