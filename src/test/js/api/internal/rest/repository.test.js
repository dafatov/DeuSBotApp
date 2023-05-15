const app = require('express')();
const bodyParser = require('body-parser');
const locale = require('../../../configs/locale');
const request = require('supertest');

const auditDbModuleName = '../../../../../main/js/db/repositories/audit';
const birthdayDbModuleName = '../../../../../main/js/db/repositories/birthday';
const changelogDbModuleName = '../../../../../main/js/db/repositories/changelog';
const permissionDbModuleName = '../../../../../main/js/db/repositories/permission';
const publicistDbModuleName = '../../../../../main/js/db/repositories/publicist';
const responsesDbModuleName = '../../../../../main/js/db/repositories/responses';
const sessionDbModuleName = '../../../../../main/js/db/repositories/session';
const statisticsDbModuleName = '../../../../../main/js/db/repositories/statistics';
const usersDbModuleName = '../../../../../main/js/db/repositories/users';
const variablesDbModuleName = '../../../../../main/js/db/repositories/variables';
const securityModuleName = '../../../../../main/js/api/internal/security';
const auditDbMocked = jest.mock(auditDbModuleName).requireMock(auditDbModuleName);
const birthdayDbMocked = jest.mock(birthdayDbModuleName).requireMock(birthdayDbModuleName);
const changelogDbMocked = jest.mock(changelogDbModuleName).requireMock(changelogDbModuleName);
const permissionDbMocked = jest.mock(permissionDbModuleName).requireMock(permissionDbModuleName);
const publicistDbMocked = jest.mock(publicistDbModuleName).requireMock(publicistDbModuleName);
const responsesDbMocked = jest.mock(responsesDbModuleName).requireMock(responsesDbModuleName);
const sessionDbMocked = jest.mock(sessionDbModuleName).requireMock(sessionDbModuleName);
const statisticsDbMocked = jest.mock(statisticsDbModuleName).requireMock(statisticsDbModuleName);
const usersDbMocked = jest.mock(usersDbModuleName).requireMock(usersDbModuleName);
const variablesDbMocked = jest.mock(variablesDbModuleName).requireMock(variablesDbModuleName);
const securityMocked = jest.mock(securityModuleName).requireMock(securityModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../../main/js/api/internal/rest/repository');

beforeAll(() => locale.init());

describe('execute', () => {
  beforeAll(() => {
    app.use(bodyParser.json({type: '*/*'}));
    execute({app});
  });

  describe('POST /repository/clear-cache', () => {
    test('filtered', async () => {
      securityMocked.authCheckForbidden.mockResolvedValueOnce();
      usersDbMocked.clearCache.mockReturnValueOnce(true);
      sessionDbMocked.clearCache.mockReturnValueOnce(true);

      const result = await request(app).post('/repository/clear-cache?repositories=["users", "session"]');

      expect(result.res.text).toEqual('{"users":true,"session":true}');
      expect(auditDbMocked.clearCache).not.toHaveBeenCalled();
      expect(birthdayDbMocked.clearCache).not.toHaveBeenCalled();
      expect(changelogDbMocked.clearCache).not.toHaveBeenCalled();
      expect(permissionDbMocked.clearCache).not.toHaveBeenCalled();
      expect(publicistDbMocked.clearCache).not.toHaveBeenCalled();
      expect(responsesDbMocked.clearCache).not.toHaveBeenCalled();
      expect(sessionDbMocked.clearCache).toHaveBeenCalledWith();
      expect(statisticsDbMocked.clearCache).not.toHaveBeenCalled();
      expect(usersDbMocked.clearCache).toHaveBeenCalledWith();
      expect(variablesDbMocked.clearCache).not.toHaveBeenCalled();
    });

    test('not filtered', async () => {
      securityMocked.authCheckForbidden.mockResolvedValueOnce();
      auditDbMocked.clearCache.mockReturnValueOnce(true);
      birthdayDbMocked.clearCache.mockReturnValueOnce(true);
      changelogDbMocked.clearCache.mockReturnValueOnce(true);
      permissionDbMocked.clearCache.mockReturnValueOnce(true);
      publicistDbMocked.clearCache.mockReturnValueOnce(true);
      responsesDbMocked.clearCache.mockReturnValueOnce(true);
      sessionDbMocked.clearCache.mockReturnValueOnce(true);
      statisticsDbMocked.clearCache.mockReturnValueOnce(true);
      usersDbMocked.clearCache.mockReturnValueOnce(true);
      variablesDbMocked.clearCache.mockReturnValueOnce(true);

      const result = await request(app).post('/repository/clear-cache?repositories=[]');

      expect(result.res.text).toEqual('{"audit.js":true,"birthday.js":true,"changelog.js":true,"permission.js":true,"publicist.js":true,'
        + '"queue.js":null,"responses.js":true,"session.js":true,"statistics.js":true,"users.js":true,"variables.js":true}');
      expect(auditDbMocked.clearCache).toHaveBeenCalledWith();
      expect(birthdayDbMocked.clearCache).toHaveBeenCalledWith();
      expect(changelogDbMocked.clearCache).toHaveBeenCalledWith();
      expect(permissionDbMocked.clearCache).toHaveBeenCalledWith();
      expect(publicistDbMocked.clearCache).toHaveBeenCalledWith();
      expect(responsesDbMocked.clearCache).toHaveBeenCalledWith();
      expect(sessionDbMocked.clearCache).toHaveBeenCalledWith();
      expect(statisticsDbMocked.clearCache).toHaveBeenCalledWith();
      expect(usersDbMocked.clearCache).toHaveBeenCalledWith();
      expect(variablesDbMocked.clearCache).toHaveBeenCalledWith();
    });

    test('failure', async () => {
      const result = await request(app).post('/repository/clear-cache');

      expect(result.res.text).toBeTruthy();
      expect(result.status).toEqual(500);
      expect(auditDbMocked.clearCache).not.toHaveBeenCalled();
      expect(birthdayDbMocked.clearCache).not.toHaveBeenCalled();
      expect(changelogDbMocked.clearCache).not.toHaveBeenCalled();
      expect(permissionDbMocked.clearCache).not.toHaveBeenCalled();
      expect(publicistDbMocked.clearCache).not.toHaveBeenCalled();
      expect(responsesDbMocked.clearCache).not.toHaveBeenCalled();
      expect(sessionDbMocked.clearCache).not.toHaveBeenCalled();
      expect(statisticsDbMocked.clearCache).not.toHaveBeenCalled();
      expect(usersDbMocked.clearCache).not.toHaveBeenCalled();
      expect(variablesDbMocked.clearCache).not.toHaveBeenCalled();
    });

    test('forbidden', async () => {
      securityMocked.authCheckForbidden.mockRejectedValueOnce();

      const result = await request(app).post('/repository/clear-cache');

      expect(result.res.text).toEqual('');
      expect(result.status).toEqual(403);
      expect(auditDbMocked.clearCache).not.toHaveBeenCalled();
      expect(birthdayDbMocked.clearCache).not.toHaveBeenCalled();
      expect(changelogDbMocked.clearCache).not.toHaveBeenCalled();
      expect(permissionDbMocked.clearCache).not.toHaveBeenCalled();
      expect(publicistDbMocked.clearCache).not.toHaveBeenCalled();
      expect(responsesDbMocked.clearCache).not.toHaveBeenCalled();
      expect(sessionDbMocked.clearCache).not.toHaveBeenCalled();
      expect(statisticsDbMocked.clearCache).not.toHaveBeenCalled();
      expect(usersDbMocked.clearCache).not.toHaveBeenCalled();
      expect(variablesDbMocked.clearCache).not.toHaveBeenCalled();
    });
  });
});
