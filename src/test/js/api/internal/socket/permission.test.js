const Client = require('socket.io-client');
const {SCOPES} = require('../../../../../main/js/db/repositories/permission');
const {Server} = require('socket.io');
const client = require('../../../../resources/mocks/client');
const {createServer} = require('http');
const expectedPatch = require('../../../../resources/api/internal/socket/permission/expectedPatch');
const expectedPermissions = require('../../../../resources/api/internal/socket/permission/expectedPermissions');
const express = require('express');
const locale = require('../../../configs/locale');
const permissions = require('../../../../resources/api/internal/socket/permission/permissions');
const user = require('../../../../resources/mocks/user');

const permissionDbModuleName = '../../../../../main/js/db/repositories/permission';
const securityModuleName = '../../../../../main/js/api/internal/security';
const permissionDbMocked = jest.mock(permissionDbModuleName).requireMock(permissionDbModuleName);
const securityMocked = jest.mock(securityModuleName).requireMock(securityModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../../main/js/api/internal/socket/permission');

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

  describe('permission:getUserScopes', () => {
    test('success', () => new Promise(done => {
      securityMocked.authForScopes.mockResolvedValueOnce(Object.values(SCOPES));

      connection.client.emit('permission:getUserScopes', 'token', data => {
        expect(data).toEqual({scopes: Object.values(SCOPES)});
        expect(securityMocked.authForScopes).toHaveBeenCalledWith('token');

        done();
      });
    }));
  });

  describe('permission:getScopesDictionary', () => {
    test('success', () => new Promise(done => {
      connection.client.emit('permission:getScopesDictionary', data => {
        expect(data).toEqual({SCOPES});

        done();
      });
    }));
  });

  describe('permission:permissions', () => {
    test('failure', () => new Promise(done => {
      securityMocked.authCheckForbidden.mockRejectedValueOnce();

      connection.client.emit('permission:permissions', 'token');
      connection.client.once('permission:permissions', data => {
        expect(data).toEqual({data: 'Доступ к "permissions" запрещен', status: 403});
        expect(securityMocked.authCheckForbidden).toHaveBeenCalledWith('token', 'api.permission.permissions');
        expect(permissionDbMocked.getAll).not.toHaveBeenCalled();

        done();
      });
    }));

    test('success', () => new Promise(done => {
      securityMocked.authCheckForbidden.mockResolvedValueOnce();
      permissionDbMocked.getAll.mockResolvedValueOnce(permissions);

      connection.client.emit('permission:permissions', 'token');
      connection.client.once('permission:permissions', data => {
        expect(data).toEqual(expectedPermissions);
        expect(securityMocked.authCheckForbidden).toHaveBeenCalledWith('token', 'api.permission.permissions');
        expect(permissionDbMocked.getAll).toHaveBeenCalledWith();

        done();
      });
    }));
  });

  describe('permission:setPatch', () => {
    test('failure', () => new Promise(done => {
      securityMocked.authCheckForbidden.mockRejectedValueOnce();

      connection.client.emit('permission:setPatch', 'token', {patch: 'patch'}, data => {
        expect(data).toEqual({data: 'Доступ к "permissions" запрещен', status: 403});
        expect(securityMocked.authCheckForbidden).toHaveBeenCalledWith('token', 'api.permission.set');
        expect(permissionDbMocked.setPatch).not.toHaveBeenCalled();
        expect(permissionDbMocked.getAll).not.toHaveBeenCalled();

        done();
      });
    }));

    test('success', () => new Promise(done => {
      securityMocked.authCheckForbidden.mockResolvedValueOnce();
      permissionDbMocked.setPatch.mockResolvedValueOnce();
      permissionDbMocked.getAll.mockResolvedValueOnce(permissions);

      connection.client.emit('permission:setPatch', 'token', {patch: 'patch'}, data => {
        expect(data).toEqual(expectedPatch);
        expect(securityMocked.authCheckForbidden).toHaveBeenCalledWith('token', 'api.permission.set');
        expect(permissionDbMocked.setPatch).toHaveBeenCalledWith({patch: 'patch'});
        expect(permissionDbMocked.getAll).toHaveBeenCalledWith();

        done();
      });
    }));
  });

  describe('permission:getUser', () => {
    test('success', () => new Promise(done => {
      connection.client.emit('permission:getUser', '348774809003491329', data => {
        expect(data).toEqual(JSON.parse(JSON.stringify(user)));

        done();
      });
    }));
  });

  describe('permission:getUsers', () => {
    test('success', () => new Promise(done => {
      connection.client.emit('permission:getUsers', data => {
        expect(data).toEqual([
          {bot: false, id: '348774809003491329', username: 'DemetriouS'},
          {id: '233923369685352449'},
          {id: '381845173384249356'},
          {id: '268080849172430850'},
          {id: '229605426327584769'},
        ]);

        done();
      });
    }));
  });

  describe('permission:getScopes', () => {
    test('success', () => new Promise(done => {
      connection.client.emit('permission:getScopes', data => {
        expect(data).toEqual(Object.values(SCOPES));

        done();
      });
    }));
  });
});
