const {Collection} = require('discord.js');
const guild = require('./guild');

module.exports = {
  commands: new Collection(),
  guilds: {
    fetch: jest.fn(guildResolvable => Promise.resolve(getGuilds(guildResolvable))),
  },
  user: {
    id: '909473788779958363',
    toString: () => '@<909473788779958363>'
  },
  users: {
    fetch: jest.fn(userId => Promise.resolve(new Collection([
      ['348774809003491329', {id: '348774809003491329'}]
    ]).get(userId))),
  },
  ws: {
    ping: 123.111,
  },
};

const getGuilds = guildResolvable => {
  const guilds = new Collection([
    ['301783183828189184', guild], [
      '905052154027475004', {
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
        id: '905052154027475004',
        name: 'Among Булок',
      },
    ],
  ]);

  if (guildResolvable) {
    return guilds.find(guild => guildResolvable === guild.id);
  } else {
    return guilds;
  }
};
