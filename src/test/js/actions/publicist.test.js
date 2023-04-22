const {DISCORD_EMBEDS_MAX} = require('../../../main/js/utils/constants');
const birthdayContent = require('../../resources/actions/publications/birthdays/expectedContent');
const changelogContent = require('../../resources/actions/publications/changelog/expectedContent');
const client = require('../../resources/mocks/client');
const freebieContent = require('../../resources/actions/publications/freebie/expectedContent');
const githubContent = require('../../resources/actions/publications/github/expectedContent');
const guild = require('../../resources/mocks/guild');
const locale = require('../configs/locale');

const auditorModuleName = '../../../main/js/actions/auditor';
const birthdayModuleName = '../../../main/js/actions/publications/birthday';
const changelogModuleName = '../../../main/js/actions/publications/changelog';
const freebieModuleName = '../../../main/js/actions/publications/freebie';
const githubModuleName = '../../../main/js/actions/publications/github';
const publicistDbModuleName = '../../../main/js/db/repositories/publicist';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const birthdayMocked = jest.mock(birthdayModuleName).requireMock(birthdayModuleName);
const changelogMocked = jest.mock(changelogModuleName).requireMock(changelogModuleName);
const freebieMocked = jest.mock(freebieModuleName).requireMock(freebieModuleName);
const githubMocked = jest.mock(githubModuleName).requireMock(githubModuleName);
const publicistDbMocked = jest.mock(publicistDbModuleName).requireMock(publicistDbModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {init} = require('../../../main/js/actions/publicist');

beforeAll(() => locale.init());

describe('init', () => {
  test('emptyContent', async () => {
    const guilds = [{guildId: '301783183828189184', channelId: '922163692940951574'}];
    jest.spyOn(global, 'setTimeout').mockReturnValueOnce();
    birthdayMocked.content.mockResolvedValueOnce(null);
    birthdayMocked.condition.mockResolvedValueOnce(true);
    changelogMocked.content.mockResolvedValueOnce(null);
    changelogMocked.condition.mockResolvedValueOnce(true);
    freebieMocked.content.mockResolvedValueOnce(null);
    freebieMocked.condition.mockResolvedValueOnce(true);
    githubMocked.content.mockResolvedValueOnce(null);
    githubMocked.condition.mockResolvedValueOnce(true);
    publicistDbMocked.getAll
      .mockResolvedValueOnce(guilds)
      .mockResolvedValueOnce(guilds)
      .mockResolvedValueOnce(guilds)
      .mockResolvedValueOnce(guilds);

    await init(client);

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 62987);
    expect(auditorMocked.audit).toHaveBeenCalledTimes(1);
    expect(publicistDbMocked.getAll).toHaveBeenCalledTimes(4);
    expect(guild.send).not.toHaveBeenCalled();
    expect(changelogMocked.onPublished).not.toHaveBeenCalled();
    expect(freebieMocked.onPublished).not.toHaveBeenCalled();
    expect(githubMocked.onPublished).not.toHaveBeenCalled();
  });

  test('false condition', async () => {
    jest.spyOn(global, 'setTimeout').mockReturnValueOnce();
    birthdayMocked.condition.mockResolvedValueOnce(false);
    changelogMocked.condition.mockResolvedValueOnce(false);
    freebieMocked.condition.mockResolvedValueOnce(false);
    githubMocked.condition.mockResolvedValueOnce(false);

    await init(client);

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 62987);
    expect(auditorMocked.audit).toHaveBeenCalledTimes(1);
    expect(publicistDbMocked.getAll).not.toHaveBeenCalled();
    expect(guild.send).not.toHaveBeenCalled();
    expect(changelogMocked.onPublished).not.toHaveBeenCalled();
    expect(freebieMocked.onPublished).not.toHaveBeenCalled();
    expect(githubMocked.onPublished).not.toHaveBeenCalled();
  });

  test('success', async () => {
    const guilds = [{guildId: '301783183828189184', channelId: '922163692940951574'}];
    jest.spyOn(global, 'setTimeout').mockReturnValueOnce();
    birthdayMocked.content.mockResolvedValueOnce(birthdayContent);
    birthdayMocked.condition.mockResolvedValueOnce(true);
    changelogMocked.content.mockResolvedValueOnce(changelogContent);
    changelogMocked.condition.mockResolvedValueOnce(true);
    freebieMocked.content.mockResolvedValueOnce(freebieContent);
    freebieMocked.condition.mockResolvedValueOnce(true);
    githubMocked.content.mockResolvedValueOnce(githubContent);
    githubMocked.condition.mockResolvedValueOnce(true);
    publicistDbMocked.getAll
      .mockResolvedValueOnce(guilds)
      .mockResolvedValueOnce(guilds)
      .mockResolvedValueOnce(guilds)
      .mockResolvedValueOnce(guilds);

    await init(client);

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 62987);
    expect(auditorMocked.audit).toHaveBeenCalledTimes(8);
    expect(publicistDbMocked.getAll).toHaveBeenCalledTimes(4);
    expect(guild.send).toHaveBeenNthCalledWith(1, birthdayContent['301783183828189184']);
    expect(guild.send).toHaveBeenNthCalledWith(2, changelogContent.default);
    expect(guild.send).toHaveBeenNthCalledWith(3, freebieContent.default);
    expect(guild.send).toHaveBeenNthCalledWith(4, preparedGithubOnPublishedMessages[0]);
    expect(guild.send).toHaveBeenNthCalledWith(5, preparedGithubOnPublishedMessages[1]);
    expect(guild.send).toHaveBeenNthCalledWith(6, preparedGithubOnPublishedMessages[2]);
    expect(guild.send).toHaveBeenNthCalledWith(7, preparedGithubOnPublishedMessages[3]);
    expect(changelogMocked.onPublished).toHaveBeenCalledWith([
      {...changelogContent.default, guildId: '301783183828189184'},
    ], changelogContent.variables);
    expect(freebieMocked.onPublished).toHaveBeenCalledWith([
      {...freebieContent.default, guildId: '301783183828189184'},
    ], freebieContent.variables);
    expect(githubMocked.onPublished).toHaveBeenCalledWith(preparedGithubOnPublishedMessages
      .map(message => ({...message, guildId: '301783183828189184'})), githubContent.variables);
  });
});

const preparedGithubOnPublishedMessages = [
  {
    content: githubContent['301783183828189184'].content,
    embeds: githubContent['301783183828189184'].embeds.slice(0, DISCORD_EMBEDS_MAX),
  },
  {
    content: githubContent['301783183828189184'].content,
    embeds: githubContent['301783183828189184'].embeds.slice(DISCORD_EMBEDS_MAX, 2 * DISCORD_EMBEDS_MAX),
  },
  {
    content: githubContent['301783183828189184'].content,
    embeds: githubContent['301783183828189184'].embeds.slice(2 * DISCORD_EMBEDS_MAX, 3 * DISCORD_EMBEDS_MAX),
  },
  {
    content: githubContent['301783183828189184'].content,
    embeds: githubContent['301783183828189184'].embeds.slice(3 * DISCORD_EMBEDS_MAX, 4 * DISCORD_EMBEDS_MAX),
  },
];
