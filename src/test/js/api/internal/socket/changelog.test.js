const Client = require('socket.io-client');
const {Server} = require('socket.io');
const changelogList = require('../../../../resources/api/internal/socket/changelog/changelogList');
const {createServer} = require('http');
const expectedChangelogList = require('../../../../resources/api/internal/socket/changelog/expectedChangelogList');
const express = require('express');
const locale = require('../../../configs/locale');

const changelogModuleName = '../../../../../main/js/actions/changelog';
const changelogDbModuleName = '../../../../../main/js/db/repositories/changelog';
const changelogMocked = jest.mock(changelogModuleName).requireMock(changelogModuleName);
const changelogDbMocked = jest.mock(changelogDbModuleName).requireMock(changelogDbModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../../main/js/api/internal/socket/changelog');

beforeAll(() => locale.init());

describe('execute', () => {
  const connection = {};

  beforeAll(() => new Promise(done => {
    const httpServer = createServer(express());

    connection.io = new Server(httpServer);
    connection.io.on('connection', socket => execute({socket}));

    httpServer.listen(() => {
      connection.client = Client(`http://localhost:${(httpServer.address().port)}`);
      connection.client.on('connect', done);
    });
  }));

  afterAll(() => {
    connection.io.close();
    connection.client.close();
  });

  describe('changelog:changelog', () => {
    test('success', () => new Promise(done => {
      changelogDbMocked.getAll.mockResolvedValueOnce(changelogList);

      connection.client.emit('changelog:changelog');
      connection.client.once('changelog:changelog', data => {
        expect(changelogDbMocked.getAll).toHaveBeenCalledWith();
        expect(data).toEqual(expectedChangelogList);

        done();
      });
    }));
  });

  describe('changelog:publish', () => {
    test('success', () => new Promise(done => {
      changelogMocked.publish.mockResolvedValueOnce('1.1.1');
      changelogDbMocked.clearCache.mockResolvedValueOnce();
      changelogDbMocked.getAll.mockResolvedValueOnce(changelogList);

      connection.client.emit('changelog:publish', '1.1.1', {isPublic: true, message: '{"ad": "message"}'}, data => {
        expect(data).toBe('1.1.1');
      });
      connection.client.once('changelog:changelog', data => {
        expect(changelogMocked.publish).toHaveBeenCalledWith('1.1.1', 'deus_bot_app', true, '{"ad": "message"}');
        expect(changelogDbMocked.clearCache).toHaveBeenCalledWith();
        expect(changelogDbMocked.getAll).toHaveBeenCalledWith();
        expect(data).toEqual(expectedChangelogList);

        done();
      });
    }));
  });
});
