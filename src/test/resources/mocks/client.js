const {Collection} = require('discord.js');
const guild = require('./guild');

module.exports = {
  commands: new Collection(),
  guilds: {
    fetch: jest.fn(() => Promise.resolve([
      guild, {
        fetch: jest.fn(() => Promise.resolve({
          id: '905052154027475004',
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
      },
    ])),
  },
  user: {
    id: '909473788779958363',
  },
  ws: {
    ping: 123.111,
  },
};
