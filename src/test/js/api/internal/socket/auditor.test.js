const Client = require('socket.io-client');
const {Server} = require('socket.io');
const client = require('../../../../resources/mocks/client');
const {createServer} = require('http');
const express = require('express');
const locale = require('../../../configs/locale');

const auditorModuleName = '../../../../../main/js/actions/auditor';
const auditDbModuleName = '../../../../../main/js/db/repositories/audit';
const securityModuleName = '../../../../../main/js/api/internal/security';
const auditorMocked = jest.mock(auditorModuleName).requireMock(auditorModuleName);
const auditDbMocked = jest.mock(auditDbModuleName).requireMock(auditDbModuleName);
const securityMocked = jest.mock(securityModuleName).requireMock(securityModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../../main/js/api/internal/socket/auditor');

beforeAll(() => locale.init());

describe('execute', () => {
  const connection = {};

  beforeAll(() => new Promise(done => {
    const httpServer = createServer(express());

    connection.io = new Server(httpServer);
    connection.io.on('connection', socket => execute({socket, client}));

    httpServer.listen(() => {
      connection.client = Client(`http://localhost:${(httpServer.address().port)}`);
      connection.client.on('connect', done);
    });
  }));

  afterAll(() => {
    connection.io.close();
    connection.client.close();
  });

  describe('auditor:getGuilds', () => {
    test('success', () => new Promise(done => {
      const guilds = '[{"id": "301783183828189184", "name": "CRINGE-A-LOT"},{"id": "905052154027475004", "name": "Among Булок"}]';
      auditorMocked.getGuilds.mockResolvedValueOnce(guilds);

      connection.client.emit('auditor:getGuilds', data => {
        expect(auditorMocked.getGuilds).toHaveBeenCalledWith(client);
        expect(data).toEqual({guilds});

        done();
      });
    }));
  });

  describe('auditor:audit', () => {
    test('forbidden', () => new Promise(done => {
      securityMocked.authCheckForbidden.mockRejectedValueOnce();

      connection.client.emit('auditor:audit', 'token');
      connection.client.once('auditor:audit', data => {
        expect(securityMocked.authCheckForbidden).toHaveBeenCalledWith('token', 'api.auditor.audit');
        expect(data).toEqual({data: 'Доступ к "audit" запрещен', status: 403});

        done();
      });
    }));

    test('success', () => new Promise(done => {
      const audit = [{test1: 'test1'}, {test2: 'test2'}];
      securityMocked.authCheckForbidden.mockResolvedValueOnce();
      auditDbMocked.getAll.mockResolvedValueOnce(audit);

      connection.client.emit('auditor:audit', 'token');
      connection.client.once('auditor:audit', data => {
        expect(securityMocked.authCheckForbidden).toHaveBeenCalledWith('token', 'api.auditor.audit');
        expect(auditDbMocked.getAll).toHaveBeenCalledWith();
        expect(data).toEqual({data: audit, status: 200});

        done();
      });
    }));
  });
});
