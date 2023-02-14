// eslint-disable-next-line filenames/match-regex
module.exports = {
  clearMocks: true,
  fakeTimers: {
    doNotFake: ['setTimeout'],
    enableGlobally: true,
    now: new Date('2023-02-06T10:20:27.013Z').getTime(),
  },
  verbose: true,
};
