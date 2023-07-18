const expectedPlaylist = require('../../../resources/api/external/youtube/expectedPlaylist');
const expectedSearch = require('../../../resources/api/external/youtube/expectedSearch');
const expectedSong = require('../../../resources/api/external/youtube/expectedSong');
const filters = require('../../../resources/api/external/youtube/filters');
const interaction = require('../../../resources/mocks/commandInteraction');
const playlist = require('../../../resources/api/external/youtube/playlist');
const search = require('../../../resources/api/external/youtube/search');
const searchSong = require('../../../resources/api/external/youtube/searchSong');
const song = require('../../../resources/api/external/youtube/song');

const ytplMocked = jest.mock('ytpl').requireMock('ytpl');
const ytdlMocked = jest.mock('ytdl-core').requireMock('ytdl-core');
const ytsrMocked = jest.mock('ytsr').requireMock('ytsr');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {getPlaylist, getSearch, getSong, getStream} = require('../../../../main/js/api/external/youtube');

beforeAll(() => {
  process.env.YOUTUBE_COOKIE = 'youtube_cookie';
  process.env.YOUTUBE_ID_TOKEN = 'youtube_id_token';
});

describe('getPlaylist', () => {
  test('success', async () => {
    ytplMocked.getPlaylistID.mockResolvedValueOnce('PLtcD_4Y3uPJNGDm-igZ5jYOmRI5XBABdn');
    ytplMocked.mockResolvedValueOnce(playlist);

    const result = await getPlaylist(interaction, 'https://www.youtube.com/playlist?list=PLtcD_4Y3uPJNGDm-igZ5jYOmRI5XBABdn');

    expect(result).toEqual(expectedPlaylist);
    expect(ytplMocked.getPlaylistID).toHaveBeenCalledWith('https://www.youtube.com/playlist?list=PLtcD_4Y3uPJNGDm-igZ5jYOmRI5XBABdn');
    expect(ytplMocked).toHaveBeenCalledWith('PLtcD_4Y3uPJNGDm-igZ5jYOmRI5XBABdn', {
      limit: Infinity, ...expectedOptions,
    });
  });
});

describe('getSong', () => {
  test('success', async () => {
    ytdlMocked.getBasicInfo.mockResolvedValueOnce(song);

    const result = await getSong(interaction, 'https://www.youtube.com/watch?v=W6q1AWnjNiU');

    expect(result).toEqual(expectedSong);
    expect(ytdlMocked.getBasicInfo).toHaveBeenCalledWith('https://www.youtube.com/watch?v=W6q1AWnjNiU', expectedOptions);
  });
});

describe('getSearch', () => {
  test('success', async () => {
    ytsrMocked.getFilters.mockResolvedValueOnce(filters);
    ytsrMocked.mockResolvedValueOnce(search);
    ytdlMocked.getBasicInfo.mockResolvedValueOnce(searchSong);

    const result = await getSearch(interaction, 'red alert 3 song');

    expect(result).toEqual(expectedSearch);
    expect(ytsrMocked.getFilters).toHaveBeenCalledWith('red alert 3 song', expectedOptions);
    expect(ytsrMocked).toHaveBeenCalledWith('https://www.youtube.com/results?search_query=red+alert+3+song&sp=EgIQAQ%253D%253D',
      {gl: 'RU', hl: 'ru', limit: 1}, expectedOptions,
    );
    expect(ytdlMocked.getBasicInfo).toHaveBeenCalledWith('https://www.youtube.com/watch?v=GKvlt6rpb4Y', expectedOptions);
  });
});

describe('getStream', () => {
  test('success', async () => {
    ytdlMocked.mockReturnValueOnce('some stream');

    const result = await getStream('https://www.youtube.com/watch?v=GKvlt6rpb4Y');

    expect(result).toEqual('some stream');
    expect(ytdlMocked).toHaveBeenCalledWith('https://www.youtube.com/watch?v=GKvlt6rpb4Y', {
      filter: 'audioonly', highWaterMark: 33554432, quality: 'highestaudio',
      ...expectedOptions,
    });
  });
});

const expectedOptions = {
  requestOptions: {
    headers: {
      Cookie: 'youtube_cookie',
      'x-youtube-identity-token': 'youtube_id_token',
    },
  },
};
