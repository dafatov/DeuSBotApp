const Client = require('socket.io-client');
const {Server} = require('socket.io');
const client = require('../../../../resources/mocks/client');
const {createServer} = require('http');
const express = require('express');
const locale = require('../../../configs/locale');
const member = require('../../../../resources/mocks/member');
const user = require('../../../../resources/mocks/user');

const userDbModuleName = '../../../../../main/js/db/repositories/user';
const radiosModuleName = '../../../../../main/js/actions/radios';
const skipModuleName = '../../../../../main/js/actions/commands/skip';
const pauseModuleName = '../../../../../main/js/actions/commands/pause';
const loopModuleName = '../../../../../main/js/actions/commands/loop';
const removeModuleName = '../../../../../main/js/actions/commands/remove';
const moveModuleName = '../../../../../main/js/actions/commands/move';
const shuffleModuleName = '../../../../../main/js/actions/commands/shuffle';
const clearModuleName = '../../../../../main/js/actions/commands/clear';
const playModuleName = '../../../../../main/js/actions/commands/play';
const shikimoriModuleName = '../../../../../main/js/actions/commands/shikimori';
const radioModuleName = '../../../../../main/js/actions/commands/radio';
const securityModuleName = '../../../../../main/js/api/internal/security';
const userDbMocked = jest.mock(userDbModuleName).requireMock(userDbModuleName);
const radiosMocked = jest.mock(radiosModuleName).requireMock(radiosModuleName);
const skipMocked = jest.mock(skipModuleName).requireMock(skipModuleName);
const pauseMocked = jest.mock(pauseModuleName).requireMock(pauseModuleName);
const loopMocked = jest.mock(loopModuleName).requireMock(loopModuleName);
const removeMocked = jest.mock(removeModuleName).requireMock(removeModuleName);
const moveMocked = jest.mock(moveModuleName).requireMock(moveModuleName);
const shuffleMocked = jest.mock(shuffleModuleName).requireMock(shuffleModuleName);
const clearMocked = jest.mock(clearModuleName).requireMock(clearModuleName);
const playMocked = jest.mock(playModuleName).requireMock(playModuleName);
const shikimoriMocked = jest.mock(shikimoriModuleName).requireMock(shikimoriModuleName);
const radioMocked = jest.mock(radioModuleName).requireMock(radioModuleName);
const securityMocked = jest.mock(securityModuleName).requireMock(securityModuleName);

// eslint-disable-next-line sort-imports-requires/sort-requires
const {execute} = require('../../../../../main/js/api/internal/socket/player');

beforeAll(() => locale.init());

describe('execute', () => {
  const connection = {};
  const interaction = {guildId: '301783183828189184', member, user};

  beforeAll(() => new Promise(done => {
    const httpServer = createServer(express());

    connection.io = new Server(httpServer);
    connection.io.on('connection', socket => execute({io: connection.io, socket, client}));

    httpServer.listen(() => {
      connection.client = Client(`http://localhost:${(httpServer.address().port)}`);
      connection.client.on('connect', done);
    });
  }));

  afterAll(() => {
    connection.io.close();
    connection.client.close();
  });

  describe('nowPlaying', () => {
    const nowPlaying = {};

    describe('nowPlaying:now', () => {
      test('success', () => new Promise(done => {
        securityMocked.authForNowPlaying.mockResolvedValueOnce(nowPlaying);

        connection.client.emit('nowPlaying:now', 'token');
        connection.client.once('nowPlaying:now', data => {
          expect(securityMocked.authForNowPlaying).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(nowPlaying);

          done();
        });
      }));
    });

    describe('nowPlaying:skip', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForNowPlaying.mockResolvedValueOnce(nowPlaying);

        connection.client.emit('nowPlaying:skip', 'token', data => {
          expect(data).toBeNull();
          expect(skipMocked.skip).not.toHaveBeenCalled();
        });
        connection.client.once('nowPlaying:now', data => {
          expect(securityMocked.authForNowPlaying).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(nowPlaying);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForNowPlaying.mockResolvedValueOnce(nowPlaying);
        skipMocked.skip.mockResolvedValueOnce({});

        connection.client.emit('nowPlaying:skip', 'token', data => {
          expect(data).toEqual({});
          expect(skipMocked.skip).toHaveBeenCalledWith(interaction, false);
        });
        connection.client.once('nowPlaying:now', data => {
          expect(securityMocked.authForNowPlaying).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(nowPlaying);

          done();
        });
      }));
    });

    describe('nowPlaying:pause', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForNowPlaying.mockResolvedValueOnce(nowPlaying);

        connection.client.emit('nowPlaying:pause', 'token', data => {
          expect(data).toBeNull();
          expect(pauseMocked.pause).not.toHaveBeenCalled();
        });
        connection.client.once('nowPlaying:now', data => {
          expect(securityMocked.authForNowPlaying).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(nowPlaying);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForNowPlaying.mockResolvedValueOnce(nowPlaying);
        pauseMocked.pause.mockResolvedValueOnce({isPause: true});

        connection.client.emit('nowPlaying:pause', 'token', data => {
          expect(data).toEqual({isPause: true});
          expect(pauseMocked.pause).toHaveBeenCalledWith(interaction, false);
        });
        connection.client.once('nowPlaying:now', data => {
          expect(securityMocked.authForNowPlaying).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(nowPlaying);

          done();
        });
      }));
    });

    describe('nowPlaying:loop', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForNowPlaying.mockResolvedValueOnce(nowPlaying);

        connection.client.emit('nowPlaying:loop', 'token', data => {
          expect(data).toBeNull();
          expect(loopMocked.loop).not.toHaveBeenCalled();
        });
        connection.client.once('nowPlaying:now', data => {
          expect(securityMocked.authForNowPlaying).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(nowPlaying);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForNowPlaying.mockResolvedValueOnce(nowPlaying);
        loopMocked.loop.mockResolvedValueOnce({isLoop: true});

        connection.client.emit('nowPlaying:loop', 'token', data => {
          expect(data).toEqual({isLoop: true});
          expect(loopMocked.loop).toHaveBeenCalledWith(interaction, false);
        });
        connection.client.once('nowPlaying:now', data => {
          expect(securityMocked.authForNowPlaying).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(nowPlaying);

          done();
        });
      }));
    });
  });

  describe('queue', () => {
    const songs = [];

    describe('queue:now', () => {
      test('success', () => new Promise(done => {
        securityMocked.authForSongs.mockResolvedValueOnce(songs);

        connection.client.emit('queue:now', 'token');
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));
    });

    describe('queue:remove', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForSongs.mockResolvedValueOnce(songs);

        connection.client.emit('queue:remove', 'token', 3, data => {
          expect(data).toBeNull();
          expect(removeMocked.remove).not.toHaveBeenCalled();
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        removeMocked.remove.mockResolvedValueOnce({isRemoved: {}});

        connection.client.emit('queue:remove', 'token', 3, data => {
          expect(data).toEqual({isRemoved: {}});
          expect(removeMocked.remove).toHaveBeenCalledWith(interaction, false, 3);
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));
    });

    describe('queue:move', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForSongs.mockResolvedValueOnce(songs);

        connection.client.emit('queue:move', 'token', 3, 1, data => {
          expect(data).toBeNull();
          expect(moveMocked.move).not.toHaveBeenCalled();
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        moveMocked.move.mockResolvedValueOnce({isMoved: {}, newIndex: 3});

        connection.client.emit('queue:move', 'token', 3, 1, data => {
          expect(data).toEqual({isMoved: {}, newIndex: 3});
          expect(moveMocked.move).toHaveBeenCalledWith(interaction, false, 1, 3);
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));
    });
  });

  describe('control', () => {
    const songs = [];

    describe('control:shuffle', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForSongs.mockResolvedValueOnce(songs);

        connection.client.emit('control:shuffle', 'token', data => {
          expect(data).toBeNull();
          expect(shuffleMocked.shuffle).not.toHaveBeenCalled();
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        shuffleMocked.shuffle.mockResolvedValueOnce({});

        connection.client.emit('control:shuffle', 'token', data => {
          expect(data).toEqual({});
          expect(shuffleMocked.shuffle).toHaveBeenCalledWith(interaction, false);
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));
    });

    describe('control:clear', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForSongs.mockResolvedValueOnce(songs);

        connection.client.emit('control:clear', 'token', data => {
          expect(data).toBeNull();
          expect(clearMocked.clear).not.toHaveBeenCalled();
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        clearMocked.clear.mockResolvedValueOnce({});

        connection.client.emit('control:clear', 'token', data => {
          expect(data).toEqual({});
          expect(clearMocked.clear).toHaveBeenCalledWith(interaction, false);
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));
    });

    describe('control:play', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForSongs.mockResolvedValueOnce(songs);

        connection.client.emit('control:play', 'token', 'audio', data => {
          expect(data).toBeNull();
          expect(playMocked.play).not.toHaveBeenCalled();
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        playMocked.play.mockResolvedValueOnce({added: {}});

        connection.client.emit('control:play', 'token', 'audio', data => {
          expect(data).toEqual({added: {}});
          expect(playMocked.play).toHaveBeenCalledWith(interaction, false, 'audio');
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));
    });

    describe('control:getShikimoriUsers', () => {
      test('success', () => new Promise(done => {
        userDbMocked.getAll.mockResolvedValueOnce([{login: 'login'}]);

        connection.client.emit('control:getShikimoriUsers', data => {
          expect(data).toEqual({profiles: ['login']});

          done();
        });
      }));
    });

    describe('control:shikimori', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForSongs.mockResolvedValueOnce(songs);

        connection.client.emit('control:shikimori', 'token', 'login', 'count', data => {
          expect(data).toBeNull();
          expect(shikimoriMocked.play).not.toHaveBeenCalled();
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        shikimoriMocked.play.mockResolvedValueOnce({added: {}});

        connection.client.emit('control:shikimori', 'token', 'login', 'count', data => {
          expect(data).toEqual({added: {}});
          expect(shikimoriMocked.play).toHaveBeenCalledWith(interaction, false, 'login', 'count');
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));
    });

    describe('control:getRadios', () => {
      test('success', () => new Promise(done => {
        radiosMocked.getRadios.mockReturnValueOnce(new Map([['', {}]]));

        connection.client.emit('control:getRadios', data => {
          expect(data).toEqual({radios: ['']});

          done();
        });
      }));
    });

    describe('control:radio', () => {
      test('failure', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockRejectedValueOnce();
        securityMocked.authForSongs.mockResolvedValueOnce(songs);

        connection.client.emit('control:radio', 'token', 'radioKey', data => {
          expect(data).toBeNull();
          expect(radioMocked.radio).not.toHaveBeenCalled();
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));

      test('success', () => new Promise(done => {
        securityMocked.authForVoiceMember.mockResolvedValueOnce(member);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        securityMocked.authForSongs.mockResolvedValueOnce(songs);
        radioMocked.radio.mockResolvedValueOnce({added: {}});

        connection.client.emit('control:radio', 'token', 'radioKey', data => {
          expect(data).toEqual({added: {}});
          expect(radioMocked.radio).toHaveBeenCalledWith(interaction, false, 'radioKey');
        });
        connection.client.once('queue:now', data => {
          expect(securityMocked.authForSongs).toHaveBeenCalledWith('token', client);
          expect(data).toEqual(songs);

          done();
        });
      }));
    });
  });
});
