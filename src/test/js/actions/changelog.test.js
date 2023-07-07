const changelogConfig = require('../../../main/js/configs/changelog');
const locale = require('../configs/locale');
const message = require('../../resources/actions/changelog/message');

const auditorModuleName = '../../../main/js/actions/auditor';
const changelogDbModuleName = '../../../main/js/db/repositories/changelog';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const changelogDbMocked = jest.mock(changelogDbModuleName).requireMock(changelogDbModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const changelog = require('../../../main/js/actions/changelog');

beforeAll(() => locale.init());

describe('init', () => {
  test('success', async () => {
    process.env.npm_package_config_isPublic = true;
    process.env.npm_package_version = '1.1.1';
    Object.keys(changelogConfig).forEach(key => jest.replaceProperty(changelogConfig, key, message[key]));
    jest.spyOn(changelog, 'publish').mockResolvedValueOnce();

    await changelog.init();

    expect(changelog.publish).toHaveBeenCalledWith('1.1.1', 'deus_bot', true,
      {'ad': '', 'announce': '', 'bugfixes': [], 'features': [], 'footer': null},
    );
  });
});

describe('publish', () => {
  test.each([
    {isPublic: null},
    {isPublic: true, version: null},
    {isPublic: true, version: '1.1.2', application: null},
    {isPublic: true, version: '1.1.2', application: 'deus_bot', message: null},
    {isPublic: false, version: '1.1.2', application: 'deus_bot', message},
    {isPublic: true, version: '1.1.2', application: 'deus_bot', message, lastVersion: '1.1.2'},
  ])(
    'unchanged version: {$isPublic, $version, $application, $message, $lastVersion}',
    async ({isPublic, version, application, message, lastVersion}) => {
      changelogDbMocked.getLast.mockResolvedValueOnce({version: lastVersion});

      const result = await changelog.publish(version, application, isPublic, message);

      expect(result).toEqual(lastVersion);
      expect(changelogDbMocked.add).not.toHaveBeenCalled();
      expect(auditorMocked.audit).not.toHaveBeenCalled();
    },
  );

  test('unchanged message', async () => {
    changelogDbMocked.getLast.mockResolvedValueOnce({version: '1.1.1', message});

    const result = await changelog.publish('1.1.2', 'application', true, message);

    expect(result).toEqual('1.1.2');
    expect(changelogDbMocked.add).not.toHaveBeenCalled();
    expect(auditorMocked.audit).toHaveBeenCalled();
  });

  test('success', async () => {
    changelogDbMocked.getLast.mockResolvedValueOnce({version: '1.1.1', message});
    changelogDbMocked.add.mockResolvedValueOnce();

    const result = await changelog.publish('1.1.2', 'application', true, {ad: ''});

    expect(result).toEqual('1.1.2');
    expect(changelogDbMocked.add).toHaveBeenCalledWith('1.1.2', 'application', {ad:''});
    expect(auditorMocked.audit).toHaveBeenCalled();
  });
});
