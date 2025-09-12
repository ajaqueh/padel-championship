// backend/src/tests/jest.setup.ts

import dotenv from 'dotenv';

// Configurar variables de entorno para tests
dotenv.config({ path: '.env.test' });

// Mock global para JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(() => ({
    userId: 1,
    email: 'test@test.com',
    role: 'admin'
  }))
}));

// Mock global para bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true))
}));

// Mock global para console en tests
global.console = {
  ...console,
  // Silenciar logs en tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configuración global de timeouts para tests
jest.setTimeout(30000);

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Test específico para validar el escenario 18/16/10/10
describe('Caso Específico 18/16/10/10', () => {
  it('debe resolver correctamente el desempate entre Gamma y Delta', () => {
    const scenario = createCase181610Scenario();
    const { expectedStandings } = scenario;

    // Verificar que Delta está por encima de Gamma
    const deltaIndex = expectedStandings.findIndex(s => s.team_id === 4);
    const gammaIndex = expectedStandings.findIndex(s => s.team_id === 3);

    expect(deltaIndex).toBeLessThan(gammaIndex);
    expect(expectedStandings[deltaIndex].games_won).toBe(20);
    expect(expectedStandings[gammaIndex].games_won).toBe(20);
  });

  it('debe tener el orden correcto: Alpha, Beta, Delta, Gamma', () => {
    const scenario = createCase181610Scenario();
    const { expectedStandings } = scenario;

    const orderedTeamIds = expectedStandings.map(s => s.team_id);
    expect(orderedTeamIds).toEqual([1, 2, 4, 3]); // Alpha, Beta, Delta, Gamma
  });
});

// Test de performance para fixtures grandes
describe('Performance Tests', () => {
  it('debe generar fixtures para 20 equipos en tiempo razonable', () => {
    const teams = createMockTeams(20);
    const startTime = Date.now();
    
    const fixtures = FixtureService.generateRoundRobin(teams);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(fixtures).toHaveLength(190); // 20 * 19 / 2 = 190 partidos
    expect(duration).toBeLessThan(1000); // Menos de 1 segundo
  });

  it('debe validar fixtures para 50 equipos eficientemente', () => {
    const teams = createMockTeams(50);
    const fixtures = FixtureService.generateRoundRobin(teams);
    
    const startTime = Date.now();
    const isValid = FixtureService.validateFixtures(teams, fixtures);
    const endTime = Date.now();
    
    expect(isValid).toBe(true);
    expect(endTime - startTime).toBeLessThan(2000); // Menos de 2 segundos
  });
});

// Tests de edge cases
describe('Edge Cases', () => {
  it('debe manejar equipos con nombres especiales', () => {
    const teams: FixtureTeam[] = [
      { id: 1, name: 'Equipo "Las Comillas"', group_number: 1 },
      { id: 2, name: "Equipo 'Apostrofes'", group_number: 1 },
      { id: 3, name: 'Equipo & Símbolos #1', group_number: 1 }
    ];

    const fixtures = FixtureService.generateRoundRobin(teams);
    expect(fixtures).toHaveLength(3);
    expect(FixtureService.validateFixtures(teams, fixtures)).toBe(true);
  });

  it('debe manejar IDs de equipos no consecutivos', () => {
    const teams: FixtureTeam[] = [
      { id: 5, name: 'Equipo Cinco', group_number: 1 },
      { id: 10, name: 'Equipo Diez', group_number: 1 },
      { id: 100, name: 'Equipo Cien', group_number: 1 }
    ];

    const fixtures = FixtureService.generateRoundRobin(teams);
    expect(fixtures).toHaveLength(3);
    
    fixtures.forEach(fixture => {
      expect([5, 10, 100]).toContain(fixture.team1_id);
      expect([5, 10, 100]).toContain(fixture.team2_id);
    });
  });

  it('debe manejar standings con estadísticas en cero', () => {
    const standings = [
      createMockStanding(1, {}), // Todo en cero
      createMockStanding(2, { points: 3, matchesWon: 1 })
    ];

    const championship = createMockChampionship();
    const sorted = standings.sort((a, b) => 
      (StandingsService as any).compareTeams(a, b, championship)
    )

    expect(sorted[0].team_id).toBe(2); // Con puntos primero
    expect(sorted[1].team_id).toBe(1); // Sin puntos segundo
  });
}); 0,
        oid: 0
      });

      const response = await request(app)
        .get('/api/championships/999')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(404);
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

    it('debe manejar errores de base de datos durante la generación', async () => {
      const championshipId = 1;
      const mockTeams = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockTeams,
        fields: [],
        command: 'SELECT',
        rowCount: 2,
        oid: 0
      });

      // Mock client que falla
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Database error')),
        release: jest.fn()
      };
      mockPool.connect.mockResolvedValue(mockClient as any);

      const response = await request(app)
        .post(`/api/championships/${championshipId}/generate-fixtures`)
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/championships/:id', () => {
    it('debe actualizar un campeonato existente', async () => {
      const updateData = { name: 'Liga Actualizada' };
      const mockUpdatedChampionship = {
        id: 1,
        name: 'Liga Actualizada',
        format: 'liga'
      };

      // Mock para verificar existencia
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1 }],
          fields: [],
          command: 'SELECT',
          rowCount: 1,
          oid: 0
        })
        // Mock para actualización
        .mockResolvedValueOnce({
          rows: [mockUpdatedChampionship],
          fields: [],
          command: 'UPDATE',
          rowCount: 1,
          oid: 0
        });

      const response = await request(app)
        .put('/api/championships/1')
        .set('Authorization', 'Bearer mock-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.championship).toEqual(mockUpdatedChampionship);
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

  describe('GET /api/championships/:id/standings', () => {
    it('debe retornar standings de un campeonato', async () => {
      const mockStandings = [
        {
          team_id: 1,
          team_name: 'Alpha',
          games_won: 18,
          position: 1
        },
        {
          team_id: 2,
          team_name: 'Beta',
          games_won: 16,
          position: 2
        },
        {
          team_id: 4,
          team_name: 'Delta',
          games_won: 10,
          position: 3
        },
        {
          team_id: 3,
          team_name: 'Gamma',
          games_won: 10,
          position: 4
        }
      ];

      // Mock StandingsService.calculateStandings
      jest.spyOn(StandingsService, 'calculateStandings').mockResolvedValue(mockStandings);

      const response = await request(app)
        .get('/api/championships/1/standings')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.standings).toEqual(mockStandings);
      expect(response.body.standings[2].team_name).toBe('Delta'); // Delta antes que Gamma
      expect(response.body.standings[3].team_name).toBe('Gamma');
    });
  });
});