module.exports = {
  guilds: {
    fetch: jest.fn(() => Promise.resolve([
      {
        fetch: jest.fn(() => Promise.resolve({
          id: '301783183828189184',
          members: {
            fetch: jest.fn(() => Promise.resolve([
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
            ])),
          },
        })),
      }, {
        fetch: jest.fn(() => Promise.resolve({
          id: '905052154027475004',
          members: {
            fetch: jest.fn(() => Promise.resolve([
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
            ])),
          },
        })),
      },
    ])),
  },
};
