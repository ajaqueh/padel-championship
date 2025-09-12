// backend/src/tests/controllers/matchController.test.ts

import request from 'supertest';
import app from '../../app';
import { pool } from '../../types';

jest.mock('../../types', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn()
    }))
  },
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message);
    }
  }
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 1, email: 'test@test.com', role: 'admin' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => next()
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe('MatchController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/matches/:id/result', () => {
    it('debe actualizar resultado correctamente', async () => {
      const matchId = 1;
      const sets = [
        { team1_games: 6, team2_games: 4 },
        { team1_games: 6, team2_games: 2 }
      ];

      const mockMatch = {
        id: 1,
        championship_id: 1,
        team1_id: 1,
        team2_id: 2
      };

      // Mock para obtener partido
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [mockMatch] }) // GET match
          .mockResolvedValueOnce({ rows: [] }) // DELETE sets
          .mockResolvedValueOnce({ rows: [] }) // INSERT set 1
          .mockResolvedValueOnce({ rows: [] }) // INSERT set 2
          .mockResolvedValueOnce({ rows: [] }), // UPDATE match
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const response = await request(app)
        .post(`/api/matches/${matchId}/result`)
        .set('Authorization', 'Bearer mock-token')
        .send({ sets });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Resultado actualizado exitosamente');
      expect(response.body.match.team1_sets).toBe(2);
      expect(response.body.match.team2_sets).toBe(0);
      expect(response.body.match.team1_games).toBe(12);
      expect(response.body.match.team2_games).toBe(6);
    });

    it('debe validar que cada set tenga un ganador', async () => {
      const matchId = 1;
      const invalidSets = [
        { team1_games: 4, team2_games: 3 } // Ninguno llegó a 6
      ];

      const response = await request(app)
        .post(`/api/matches/${matchId}/result`)
        .set('Authorization', 'Bearer mock-token')
        .send({ sets: invalidSets });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Debe haber un ganador');
    });

    it('debe manejar partidos que no existen', async () => {
      const matchId = 999;
      const sets = [{ team1_games: 6, team2_games: 4 }];

      const mockClient = {
        query: jest.fn().mockResolvedValueOnce({ rows: [] }), // No match found
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const response = await request(app)
        .post(`/api/matches/${matchId}/result`)
        .set('Authorization', 'Bearer mock-token')
        .send({ sets });

      expect(response.status).toBe(404);
    });

    it('debe calcular correctamente un partido con 3 sets', async () => {
      const matchId = 1;
      const sets = [
        { team1_games: 6, team2_games: 4 }, // Team1 gana
        { team1_games: 3, team2_games: 6 }, // Team2 gana
        { team1_games: 6, team2_games: 2 }  // Team1 gana
      ];

      const mockMatch = {
        id: 1,
        championship_id: 1,
        team1_id: 1,
        team2_id: 2
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [mockMatch] })
          .mockResolvedValueOnce({ rows: [] }) // DELETE
          .mockResolvedValueOnce({ rows: [] }) // INSERT set 1
          .mockResolvedValueOnce({ rows: [] }) // INSERT set 2
          .mockResolvedValueOnce({ rows: [] }) // INSERT set 3
          .mockResolvedValueOnce({ rows: [] }), // UPDATE
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient as any);

      const response = await request(app)
        .post(`/api/matches/${matchId}/result`)
        .set('Authorization', 'Bearer mock-token')
        .send({ sets });

      expect(response.status).toBe(200);
      expect(response.body.match.team1_sets).toBe(2);
      expect(response.body.match.team2_sets).toBe(1);
      expect(response.body.match.team1_games).toBe(15);
      expect(response.body.match.team2_games).toBe(12);
      expect(response.body.match.winner_id).toBe(1); // Team1 ganó 2-1
    });
  });

  describe('GET /api/matches/championships/:championshipId/matches', () => {
    it('debe retornar partidos de un campeonato', async () => {
      const championshipId = 1;
      const mockMatches = [
        {
          id: 1,
          team1_name: 'Equipo A',
          team2_name: 'Equipo B',
          status: 'pending'
        }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockMatches,
        fields: [],
        command: 'SELECT',
        rowCount: 1,
        oid: 0
      });

      const response = await request(app)
        .get(`/api/matches/championships/${championshipId}/matches`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMatches);
    });
  });

  describe('POST /api/matches', () => {
    it('debe crear un nuevo partido', async () => {
      const matchData = {
        team1_id: 1,
        team2_id: 2,
        round: 1,
        group_number: 1
      };

      const mockTeams = [
        { id: 1, championship_id: 1 },
        { id: 2, championship_id: 1 }
      ];

      const mockCreatedMatch = {
        id: 1,
        ...matchData,
        championship_id: 1
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: mockTeams,
          fields: [],
          command: 'SELECT',
          rowCount: 2,
          oid: 0
        })
        .mockResolvedValueOnce({
          rows: [mockCreatedMatch],
          fields: [],
          command: 'INSERT',
          rowCount: 1,
          oid: 0
        });

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', 'Bearer mock-token')
        .send(matchData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Partido creado exitosamente');
    });

    it('debe validar que los equipos existan', async () => {
      const matchData = {
        team1_id: 999,
        team2_id: 2,
        round: 1
      };

      mockPool.query.mockResolvedValue({
        rows: [], // No teams found
        fields: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0
      });

      const response = await request(app)
        .post('/api/matches')
        .set('Authorization', 'Bearer mock-token')
        .send(matchData);

      expect(response.status).toBe(400);
    });
  });
});