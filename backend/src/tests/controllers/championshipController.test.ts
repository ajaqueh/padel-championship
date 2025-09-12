// backend/src/tests/controllers/championshipController.test.ts

import request from 'supertest';
import app from '../../app';
import { pool } from '../../types';

// Mock del pool
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

// Mock de middleware de autenticación
jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { userId: 1, email: 'test@test.com', role: 'admin' };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => next()
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe('ChampionshipController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/championships', () => {
    it('debe retornar lista de campeonatos', async () => {
      const mockChampionships = [
        {
          id: 1,
          name: 'Liga Test',
          format: 'liga',
          created_by_name: 'Admin'
        }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockChampionships,
        fields: [],
        command: 'SELECT',
        rowCount: 1,
        oid: 0
      });

      const response = await request(app)
        .get('/api/championships')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChampionships);
    });

    it('debe manejar errores de base de datos', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/championships')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/championships', () => {
    it('debe crear un nuevo campeonato', async () => {
      const newChampionship = {
        name: 'Nueva Liga',
        format: 'liga',
        start_date: '2024-01-15',
        num_groups: 1
      };

      const mockCreatedChampionship = {
        id: 1,
        ...newChampionship,
        status: 'draft',
        created_by: 1
      };

      mockPool.query.mockResolvedValue({
        rows: [mockCreatedChampionship],
        fields: [],
        command: 'INSERT',
        rowCount: 1,
        oid: 0
      });

      const response = await request(app)
        .post('/api/championships')
        .set('Authorization', 'Bearer mock-token')
        .send(newChampionship);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Campeonato creado exitosamente');
      expect(response.body.championship).toEqual(mockCreatedChampionship);
    });

    it('debe validar campos requeridos', async () => {
      const invalidChampionship = {
        name: '', // Nombre vacío
        format: 'liga'
        // Falta start_date
      };

      const response = await request(app)
        .post('/api/championships')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidChampionship);

      expect(response.status).toBe(400);
    });

    it('debe validar formato válido', async () => {
      const invalidChampionship = {
        name: 'Test',
        format: 'formato-invalido',
        start_date: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/championships')
        .set('Authorization', 'Bearer mock-token')
        .send(invalidChampionship);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/championships/:id', () => {
    it('debe retornar un campeonato específico', async () => {
      const mockChampionship = {
        id: 1,
        name: 'Liga Test',
        format: 'liga',
        created_by_name: 'Admin'
      };

      mockPool.query.mockResolvedValue({
        rows: [mockChampionship],
        fields: [],
        command: 'SELECT',
        rowCount: 1,
        oid: 0
      });

      const response = await request(app)
        .get('/api/championships/1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChampionship);
    });

    it('debe retornar 404 si el campeonato no existe', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        fields: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0
      });

      const response = await request(app)
        .put('/api/championships/999')
        .set('Authorization', 'Bearer mock-token')
        .send({ name: 'Nuevo nombre' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/championships/:id', () => {
    it('debe eliminar un campeonato exitosamente', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ id: 1, name: 'Liga eliminada' }],
        fields: [],
        command: 'DELETE',
        rowCount: 1,
        oid: 0
      });

      const response = await request(app)
        .delete('/api/championships/1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Campeonato eliminado exitosamente');
    });

    it('debe retornar 404 si el campeonato no existe', async () => {
      mockPool.query.mockResolvedValue({
        rows: [],
        fields: [],
        command: 'DELETE',
        rowCount: 0,
        oid: 0
      });

      const response = await request(app)
        .delete('/api/championships/999')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
    });
  });
});