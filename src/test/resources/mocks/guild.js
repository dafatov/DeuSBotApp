module.exports = {
  channels: {
    resolve: jest.fn(() => ({name: 'deus-bot-news'})),
  },
  fetch: jest.fn(() => Promise.resolve({
    id: '301783183828189184',
    members: {
      fetch: jest.fn(fetchMembersOptions => Promise.resolve([
        {
          user: {
            id: '348774809003491329',
          },
        },
        {
          user: {
            id: '233923369685352449',
          },
        },
        {
          user: {
            id: '381845173384249356',
          },
        },
        {
          user: {
            id: '229605426327584769',
          },
        },
      ].filter(member => fetchMembersOptions?.user?.includes(member.user.id) ?? true))),
    },
  })),
  name: 'CRINGE-A-LOT',
};
