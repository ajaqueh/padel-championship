// src/tests/controllers/championshipController.test.ts

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
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/championships/:id/generate-fixtures', () => {
    it('debe generar fixtures para un campeonato', async () => {
      const championshipId = 1;
      const mockTeams = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 },
        { id: 3, name: 'Equipo C', group_number: 1 },
        { id: 4, name: 'Equipo D', group_number: 1 }
      ];

      // Mock para obtener equipos
      mockPool.query
        .mockResolvedValueOnce({
          rows: mockTeams,
          fields: [],
          command: 'SELECT',
          rowCount: 4,
          oid: 0
        })
        // Mock para el cliente de transacción
        .mockResolvedValue({
          rows: [],
          fields: [],
          command: 'DELETE',
          rowCount: 0,
          oid: 0
        });

      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValue(mockClient as any);

      const response = await request(app)
        .post(`/api/championships/${championshipId}/generate-fixtures`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Fixtures generados exitosamente');
      expect(response.body.fixtures_count).toBe(6); // 4 equipos = 6 partidos
    });

    it('debe fallar con menos de 2 equipos', async () => {
      const championshipId = 1;
      const mockTeams = [
        { id: 1, name: 'Equipo Solitario', group_number: 1 }
      ];

      mockPool.query.mockResolvedValue({
        rows: mockTeams,
        fields: [],
        command: 'SELECT',
        rowCount: 1,
        oid: 0
      });

      const response = await request(app)
        .post(`/api/championships/${championshipId}/generate-fixtures`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Se necesitan al menos 2 equipos para generar fixtures');
    });
  });
});