const app = require('express')();
const bodyParser = require('body-parser');
const i18next = require('i18next');
const locale = require('../../../configs/locale');
const request = require('supertest');

const auditorModuleName = '../../../../../main/js/actions/auditor';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../../main/js/api/internal/rest/locale');

beforeAll(() => locale.init());

describe('execute', () => {
  beforeAll(() => {
    app.use(bodyParser.json({type: '*/*'}));
    execute({app});
  });

  describe.each([
    {ns: 'common'},
    {ns: 'discord'},
    {ns: 'inner'},
    {ns: 'web'},
  ])('GET /api/locales/ru/$ns', ({ns}) => {
    test('failure', async () => {
      jest.spyOn(i18next, 'getResourceBundle').mockImplementationOnce(() => {
        throw new Error();
      });
      auditorMocked.audit.mockResolvedValueOnce().mockResolvedValueOnce();

      const result = await request(app).get(`/api/locales/ru/${ns}`);

      expect(result.res.statusCode).toEqual(500);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });

    test('success', async () => {
      auditorMocked.audit.mockResolvedValueOnce().mockResolvedValueOnce();

      const result = await request(app).get(`/api/locales/ru/${ns}`);

      expect(result.res.text).toEqual(JSON.stringify(i18next.getResourceBundle('ru', ns)));
      expect(result.res.statusCode).toEqual(200);
      expect(auditorMocked.audit).toHaveBeenCalled();
    });
  });

  describe.each([
    {ns: 'common'},
    {ns: 'discord'},
    {ns: 'inner'},
    {ns: 'web'},
  ])('POST /api/locales/add/ru/$ns', ({ns}) => {
    test('failure', async () => {
      auditorMocked.audit.mockResolvedValueOnce().mockResolvedValueOnce();
      jest.spyOn(i18next.services.backendConnector, 'saveMissing').mockImplementation(() => {
        throw new Error();
      });

      const result = await request(app).post(`/api/locales/add/ru/${ns}`)
        .send({test: 'test', test2: 'test2'});

      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(result.res.statusCode).toEqual(500);
    });

    test('success', async () => {
      auditorMocked.audit.mockResolvedValueOnce().mockResolvedValueOnce();
      jest.spyOn(i18next.services.backendConnector, 'saveMissing').mockReturnValue();

      const result = await request(app).post(`/api/locales/add/ru/${ns}`)
        .send({test: 'test', test2: 'test2'});

      expect(i18next.services.backendConnector.saveMissing)
        .toHaveBeenNthCalledWith(1, 'ru', ns, 'test', 'test');
      expect(i18next.services.backendConnector.saveMissing)
        .toHaveBeenNthCalledWith(2, 'ru', ns, 'test2', 'test2');
      expect(auditorMocked.audit).toHaveBeenCalled();
      expect(result.res.statusCode).toEqual(200);
    });
  });
});
