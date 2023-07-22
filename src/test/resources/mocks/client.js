const {Collection} = require('discord.js');
const guild = require('./guild');
const member = require('./member');
const user = require('./user');

module.exports = {
  commands: new Collection(),
  guilds: {
    fetch: jest.fn(guildResolvable => Promise.resolve(getGuilds(guildResolvable))),
  },
  user,
  users: {
    fetch: jest.fn(userId => Promise.resolve(new Collection([[user.id, user]]).get(userId))),
  },
  ws: {
    ping: 123.111,
  },
};

const getGuilds = guildResolvable => {
  const guilds = new Collection([[guild.id, guild], [guild2.id, guild2]]);

  if (guildResolvable) {
    return guilds.find(guild => guildResolvable === guild.id);
  } else {
    return guilds;
  }
};

const guild2 = {
  fetch: jest.fn(() => Promise.resolve({
    id: guild2.id,
    members: {
      fetch: jest.fn(fetchMembersOptions => Promise.resolve([
        member,
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
};
