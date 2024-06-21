const expectedPlaylist = require('../../../resources/api/external/youtube/expectedPlaylist');
const expectedSong = require('../../../resources/api/external/youtube/expectedSong');
const interaction = require('../../../resources/mocks/commandInteraction');
const playlist = require('../../../resources/api/external/youtube/playlist');
const playlistItems = require('../../../resources/api/external/youtube/playlistItems');
const search = require('../../../resources/api/external/youtube/search');
const song = require('../../../resources/api/external/youtube/song');

const auditorModuleName = '../../../../main/js/actions/auditor';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const ytdlMocked = jest.mock('ytdl-core').requireMock('ytdl-core');
const axiosMocked = jest.mock('axios').requireMock('axios');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {getPlaylist, getSearch, getSong, getStream} = require('../../../../main/js/api/external/youtube');

beforeAll(() => {
  process.env.YOUTUBE_COOKIE = 'youtube_cookie';
  process.env.YOUTUBE_ID_TOKEN = 'youtube_id_token';
  process.env.YOUTUBE_URL = 'https://www.youtube.com';
  process.env.YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
  process.env.YOUTUBE_API_KEY = 'youtube_api_key';
});

describe('getPlaylist', () => {
  test('success', async () => {
    axiosMocked.get.mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(playlistItems[0])
      .mockResolvedValueOnce(song)
      .mockResolvedValueOnce(song)
      .mockResolvedValueOnce(playlistItems[1])
      .mockResolvedValueOnce(song)
      .mockResolvedValueOnce(song);

    const result = await getPlaylist(interaction, 'https://www.youtube.com/playlist?list=PLtcD_4Y3uPJOmsFWvOQ2t8t66DrDySUTj');

    expect(result).toEqual(expectedPlaylist);
    expect(axiosMocked.get).toHaveBeenCalledTimes(7);
    expect(axiosMocked.get).toHaveBeenNthCalledWith(1, 'https://www.googleapis.com/youtube/v3/playlists?id=PLtcD_4Y3uPJOmsFWvOQ2t8t66DrDySUTj&key=youtube_api_key&part=snippet%2CcontentDetails');
    expect(axiosMocked.get).toHaveBeenNthCalledWith(2, 'https://www.googleapis.com/youtube/v3/playlistItems?playlistId=PLtcD_4Y3uPJOmsFWvOQ2t8t66DrDySUTj&key=youtube_api_key&maxResults=50&part=contentDetails&pageToken=');
    expect(axiosMocked.get).toHaveBeenNthCalledWith(3, 'https://www.googleapis.com/youtube/v3/videos?id=gtgME6MJpk4&key=youtube_api_key&part=snippet%2CcontentDetails');
    expect(axiosMocked.get).toHaveBeenNthCalledWith(4, 'https://www.googleapis.com/youtube/v3/videos?id=q4N7EhUWOaA&key=youtube_api_key&part=snippet%2CcontentDetails');
    expect(axiosMocked.get).toHaveBeenNthCalledWith(5, 'https://www.googleapis.com/youtube/v3/playlistItems?playlistId=PLtcD_4Y3uPJOmsFWvOQ2t8t66DrDySUTj&key=youtube_api_key&maxResults=50&part=contentDetails&pageToken=EAAajgFQVDpDQUlpRUVReU9EWkRSVGhHTURJMk5rTTVNallvQVVqdXlZSEYzOWFHQTFBQldrVWlRMmxLVVZSSVVtcFNSamd3VjFST01WVkZjRkJpV0U1SFZqTmFVRlZVU2pCUFNGRXlUbXRTZVZKSWJGUldWbEp4UldkM1NUUjBMVzV6ZDFsUmMwNTFNM1ZuVFNJ');
    expect(axiosMocked.get).toHaveBeenNthCalledWith(6, 'https://www.googleapis.com/youtube/v3/videos?id=gtgME6MJak4&key=youtube_api_key&part=snippet%2CcontentDetails');
    expect(axiosMocked.get).toHaveBeenNthCalledWith(7, 'https://www.googleapis.com/youtube/v3/videos?id=q4N7EhUWOAA&key=youtube_api_key&part=snippet%2CcontentDetails');
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('not playlist', async () => {
    const result = () => getPlaylist(interaction, 'https://www.youtube.com/watch?v=W6q1AWnjNiU');

    await expect(result()).rejects.toBeUndefined();
    expect(axiosMocked.get).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('failure', async () => {
    axiosMocked.get.mockRejectedValueOnce();

    const result = () => getPlaylist(interaction, 'https://www.youtube.com/playlist?list=PLtcD_4Y3uPJNGDm-igZ5jYOmRI5XBABdn');

    await expect(result()).rejects.toBeDefined();
    expect(axiosMocked.get).toHaveBeenCalledWith('https://www.googleapis.com/youtube/v3/playlists?id=igZ5jYOmRI5XBABdn&key=youtube_api_key&part=snippet%2CcontentDetails');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('getSong', () => {
  test('success', async () => {
    axiosMocked.get.mockResolvedValueOnce(song);

    const result = await getSong(interaction, 'https://www.youtube.com/watch?v=W6q1AWnjNiU');

    expect(result).toEqual(expectedSong);
    expect(axiosMocked.get).toHaveBeenCalledWith('https://www.googleapis.com/youtube/v3/videos?id=W6q1AWnjNiU&key=youtube_api_key&part=snippet%2CcontentDetails');
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('not song', async () => {
    const result = () => getSong(interaction, 'red alert 3 song');

    await expect(result()).rejects.toBeUndefined();
    expect(axiosMocked.get).not.toHaveBeenCalled();
    expect(auditorMocked.audit).not.toHaveBeenCalled();
  });

  test('failure', async () => {
    axiosMocked.get.mockRejectedValueOnce();

    const result = () => getSong(interaction, 'https://www.youtube.com/watch?v=W6q1AWnjNiU');

    await expect(result()).rejects.toBeDefined();
    expect(axiosMocked.get).toHaveBeenCalledWith('https://www.googleapis.com/youtube/v3/videos?id=W6q1AWnjNiU&key=youtube_api_key&part=snippet%2CcontentDetails');
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});

describe('getSearch', () => {
  test('notFound', async () => {
    axiosMocked.get.mockResolvedValueOnce({data: {items: []}});

    const result = await getSearch(interaction, 'red alert 3 song');

    expect(result).toBeUndefined();
    expect(axiosMocked.get).toHaveBeenCalledWith('https://www.googleapis.com/youtube/v3/search?maxResults=1&relevanceLanguage=ru&type=video&key=youtube_api_key&q=red+alert+3+song');
  });

  test('success', async () => {
    axiosMocked.get.mockResolvedValueOnce(search).mockResolvedValueOnce(song);

    const result = await getSearch(interaction, 'red alert 3 song');

    expect(result).toEqual(expectedSong);
    expect(axiosMocked.get).toHaveBeenCalledTimes(2);
    expect(axiosMocked.get).toHaveBeenNthCalledWith(1, 'https://www.googleapis.com/youtube/v3/search?maxResults=1&relevanceLanguage=ru&type=video&key=youtube_api_key&q=red+alert+3+song');
    expect(axiosMocked.get).toHaveBeenNthCalledWith(2, 'https://www.googleapis.com/youtube/v3/videos?id=W6q1AWnjNiU&key=youtube_api_key&part=snippet%2CcontentDetails');
  });
});

describe('getStream', () => {
  test('success', async () => {
    ytdlMocked.mockReturnValueOnce('some stream');

    const result = await getStream('https://www.youtube.com/watch?v=GKvlt6rpb4Y');

    expect(result).toEqual('some stream');
    expect(ytdlMocked).toHaveBeenCalledWith('https://www.youtube.com/watch?v=GKvlt6rpb4Y', {
      dlChunkSize: 0,
      filter: 'audioonly',
      quality: 'highestaudio',
      requestOptions: {
        headers: {
          cookie: 'youtube_cookie',
          'x-youtube-identity-token': 'youtube_id_token',
        },
      },
    });
  });
});
