const app = require('express')();
const bodyParser = require('body-parser');
const locale = require('../../../configs/locale');
const request = require('supertest');
const {version} = require('../../../../../../package.json');

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../../main/js/api/internal/rest/bot');

beforeAll(() => locale.init());

describe('execute', () => {
  beforeAll(() => {
    app.use(bodyParser.json({type: '*/*'}));
    execute({app});
  });

  test('GET /', async () => {
    const result = await request(app).get('/');

    expect(result.res.text).toEqual(`Данный бот (Deus v${version}) был разработан DemetriouS (aka dafatov) в рамках частного проекта специально для дискорд сервера на чистом энтузиазме`);
  });
});
