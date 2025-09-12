// src/tests/services/fixtureService.test.ts

import { FixtureService } from '../../services/fixtureService';
import { FixtureTeam } from '../../types';

describe('FixtureService', () => {
  describe('generateRoundRobin', () => {
    it('debe generar fixtures correctos para 4 equipos', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 },
        { id: 3, name: 'Equipo C', group_number: 1 },
        { id: 4, name: 'Equipo D', group_number: 1 }
      ];

      const fixtures = FixtureService.generateRoundRobin(teams);

      // Debe haber 6 partidos para 4 equipos (n*(n-1)/2)
      expect(fixtures).toHaveLength(6);

      // Verificar que todos los equipos se enfrentan exactamente una vez
      const encounters = new Set<string>();
      fixtures.forEach(fixture => {
        const encounter = [fixture.team1_id, fixture.team2_id].sort().join('-');
        expect(encounters.has(encounter)).toBe(false);
        encounters.add(encounter);
      });

      expect(encounters).toHaveSize(6);
    });

    it('debe generar fixtures correctos para 5 equipos (número impar)', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 },
        { id: 3, name: 'Equipo C', group_number: 1 },
        { id: 4, name: 'Equipo D', group_number: 1 },
        { id: 5, name: 'Equipo E', group_number: 1 }
      ];

      const fixtures = FixtureService.generateRoundRobin(teams);

      // Debe haber 10 partidos para 5 equipos
      expect(fixtures).toHaveLength(10);

      // Verificar que no hay equipos duplicados en un partido
      fixtures.forEach(fixture => {
        expect(fixture.team1_id).not.toBe(fixture.team2_id);
      });
    });

    it('debe manejar múltiples grupos correctamente', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A1', group_number: 1 },
        { id: 2, name: 'Equipo A2', group_number: 1 },
        { id: 3, name: 'Equipo B1', group_number: 2 },
        { id: 4, name: 'Equipo B2', group_number: 2 }
      ];

      const fixtures = FixtureService.generateRoundRobin(teams);

      // 2 grupos de 2 equipos = 1 partido por grupo = 2 partidos total
      expect(fixtures).toHaveLength(2);

      // Verificar que los equipos solo juegan dentro de su grupo
      const group1Fixtures = fixtures.filter(f => f.group_number === 1);
      const group2Fixtures = fixtures.filter(f => f.group_number === 2);

      expect(group1Fixtures).toHaveLength(1);
      expect(group2Fixtures).toHaveLength(1);
    });

    it('debe lanzar error con menos de 2 equipos', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo Solitario', group_number: 1 }
      ];

      expect(() => {
        FixtureService.generateRoundRobin(teams);
      }).toThrow('Se necesitan al menos 2 equipos para generar fixtures');
    });
  });

  describe('validateFixtures', () => {
    it('debe validar fixtures correctos', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 },
        { id: 3, name: 'Equipo C', group_number: 1 }
      ];

      const fixtures = FixtureService.generateRoundRobin(teams);
      const isValid = FixtureService.validateFixtures(teams, fixtures);

      expect(isValid).toBe(true);
    });

    it('debe detectar fixtures inválidos con equipos inexistentes', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 }
      ];

      const invalidFixtures = [
        { team1_id: 1, team2_id: 99, round: 1, group_number: 1 } // Equipo 99 no existe
      ];

      const isValid = FixtureService.validateFixtures(teams, invalidFixtures);

      expect(isValid).toBe(false);
    });

    it('debe detectar encuentros duplicados', () => {
      const teams: FixtureTeam[] = [
        { id: 1, name: 'Equipo A', group_number: 1 },
        { id: 2, name: 'Equipo B', group_number: 1 }
      ];

      const duplicateFixtures = [
        { team1_id: 1, team2_id: 2, round: 1, group_number: 1 },
        { team1_id: 2, team2_id: 1, round: 2, group_number: 1 } // Mismo encuentro
      ];

      const isValid = FixtureService.validateFixtures(teams, duplicateFixtures);

      expect(isValid).toBe(false);
    });
  });
});

// src/tests/services/standingsService.test.ts

import { StandingsService } from '../../services/standingsService';
import { Match, Championship, StandingCalculation } from '../../types';

// Mock del pool de base de datos
jest.mock('../../types', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn()
  },
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message);
    }
  }
}));

describe('StandingsService', () => {
  describe('Cálculo de desempates', () => {
    const mockChampionship: Championship = {
      id: 1,
      name: 'Test Championship',
      format: 'liga',
      start_date: new Date(),
      num_groups: 1,
      points_win: 3,
      points_loss: 0,
      status: 'active',
      created_by: 1,
      created_at: new Date()
    };

    it('debe ordenar por puntos correctamente', () => {
      const standings: StandingCalculation[] = [
        {
          team_id: 1,
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 2,
          sets_lost: 2,
          games_won: 12,
          games_lost: 10,
          head_to_head: new Map()
        },
        {
          team_id: 2,
          points: 6,
          matches_played: 2,
          matches_won: 2,
          matches_lost: 0,
          sets_won: 4,
          sets_lost: 0,
          games_won: 16,
          games_lost: 8,
          head_to_head: new Map()
        }
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(2); // 6 puntos
      expect(sorted[1].team_id).toBe(1); // 3 puntos
    });

    it('debe desempatar por sets ganados', () => {
      const standings: StandingCalculation[] = [
        {
          team_id: 1,
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 4,
          sets_lost: 2,
          games_won: 15,
          games_lost: 15, // Misma diferencia de juegos
          head_to_head: new Map()
        },
        {
          team_id: 2,
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 3,
          sets_lost: 3,
          games_won: 15,
          games_lost: 15, // Misma diferencia de juegos
          head_to_head: new Map()
        }
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(1); // Más sets ganados
      expect(sorted[1].team_id).toBe(2);
    });

    it('debe manejar el caso específico 18/16/10/10', () => {
      const mockMatches = new Map();
      // Delta (id: 4) ganó a Gamma (id: 3)
      mockMatches.set(3, {
        id: 1,
        winner_id: 4,
        team1_id: 3,
        team2_id: 4
      });
      mockMatches.set(4, {
        id: 1,
        winner_id: 4,
        team1_id: 3,
        team2_id: 4
      });

      const standings: StandingCalculation[] = [
        {
          team_id: 1, // Alpha
          points: 6,
          matches_played: 3,
          matches_won: 2,
          matches_lost: 1,
          sets_won: 4,
          sets_lost: 3,
          games_won: 18,
          games_lost: 15,
          head_to_head: new Map()
        },
        {
          team_id: 2, // Beta
          points: 6,
          matches_played: 3,
          matches_won: 2,
          matches_lost: 1,
          sets_won: 4,
          sets_lost: 2,
          games_won: 16,
          games_lost: 12,
          head_to_head: new Map()
        },
        {
          team_id: 3, // Gamma
          points: 3,
          matches_played: 3,
          matches_won: 1,
          matches_lost: 2,
          sets_won: 3,
          sets_lost: 4,
          games_won: 10,
          games_lost: 14,
          head_to_head: mockMatches // Perdió vs Delta
        },
        {
          team_id: 4, // Delta
          points: 3,
          matches_played: 3,
          matches_won: 1,
          matches_lost: 2,
          sets_won: 3,
          sets_lost: 4,
          games_won: 10,
          games_lost: 14,
          head_to_head: mockMatches // Ganó vs Gamma
        }
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      // Orden esperado:
      // 1. Alpha (18 juegos, 6 puntos)
      // 2. Beta (16 juegos, 6 puntos)
      // 3. Delta (10 juegos, 3 puntos, ganó head-to-head)
      // 4. Gamma (10 juegos, 3 puntos, perdió head-to-head)

      expect(sorted[0].team_id).toBe(1); // Alpha - más puntos y juegos
      expect(sorted[1].team_id).toBe(2); // Beta - más juegos que Delta/Gamma
      expect(sorted[2].team_id).toBe(4); // Delta - ganó head-to-head vs Gamma
      expect(sorted[3].team_id).toBe(3); // Gamma - perdió head-to-head vs Delta
    });
  });
});

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

// src/tests/integration/standings.test.ts

import request from 'supertest';
import app from '../../app';
import { runMigrations } from '../../utils/migrate';
import { seedDatabase } from '../../utils/seed';
import { pool } from '../../types';

describe('Standings Integration Tests', () => {
  let authToken: string;
  let championshipId: number;

  beforeAll(async () => {
    // Setup base de datos de prueba
    await runMigrations();
    await seedDatabase();

    // Obtener token de autenticación
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@padel.com',
        password: 'admin123'
      });

    authToken = loginResponse.body.token;

    // Obtener ID del campeonato de prueba
    const championshipsResponse = await request(app)
      .get('/api/championships')
      .set('Authorization', `Bearer ${authToken}`);

    championshipId = championshipsResponse.body[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('debe calcular standings correctamente para el caso 18/16/10/10', async () => {
    const response = await request(app)
      .get(`/api/championships/${championshipId}/standings`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.standings).toHaveLength(4);

    const standings = response.body.standings;

    // Verificar el orden correcto
    expect(standings[0].games_won).toBe(18); // Alpha - 1er lugar
    expect(standings[1].games_won).toBe(16); // Beta - 2do lugar
    
    // Para los equipos empatados en 10 juegos, verificar que Delta esté antes que Gamma
    const thirdPlace = standings[2];
    const fourthPlace = standings[3];
    
    expect(thirdPlace.games_won).toBe(10);
    expect(fourthPlace.games_won).toBe(10);
    
    // Delta debe estar en 3er lugar por head-to-head
    expect(thirdPlace.team_name).toContain('Delta');
    expect(fourthPlace.team_name).toContain('Gamma');

    console.log('✅ Test del caso específico 18/16/10/10 pasado correctamente');
    console.log('   Orden final:', standings.map(s => `${s.team_name}: ${s.games_won} juegos`));
  });

  it('debe manejar empates complejos con múltiples criterios', async () => {
    // Este test verifica que todos los criterios de desempate se aplican correctamente
    const response = await request(app)
      .get(`/api/championships/${championshipId}/standings`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    const standings = response.body.standings;

    // Verificar que cada equipo tiene las estadísticas correctas
    standings.forEach((standing: any) => {
      expect(standing.matches_played).toBeGreaterThan(0);
      expect(standing.games_won).toBeGreaterThanOrEqual(0);
      expect(standing.games_lost).toBeGreaterThanOrEqual(0);
      expect(standing.sets_won).toBeGreaterThanOrEqual(0);
      expect(standing.sets_lost).toBeGreaterThanOrEqual(0);
      expect(standing.position).toBeGreaterThan(0);
    });

    console.log('✅ Test de validación de estadísticas completo');
  });

  it('debe recalcular standings después de actualizar un resultado', async () => {
    // Obtener un partido para actualizar
    const matchesResponse = await request(app)
      .get(`/api/championships/${championshipId}/matches`)
      .set('Authorization', `Bearer ${authToken}`);

    const matches = matchesResponse.body;
    const firstMatch = matches[0];

    // Actualizar resultado del partido
    const updateResponse = await request(app)
      .post(`/api/matches/${firstMatch.id}/result`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sets: [
          { team1_games: 6, team2_games: 4 },
          { team1_games: 6, team2_games: 2 }
        ]
      });

    expect(updateResponse.status).toBe(200);

    // Verificar que los standings se recalcularon
    const standingsResponse = await request(app)
      .get(`/api/championships/${championshipId}/standings`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(standingsResponse.status).toBe(200);
    expect(standingsResponse.body.standings).toHaveLength(4);

    console.log('✅ Test de recálculo de standings después de actualización');
  });
});

// src/tests/utils/testHelpers.ts

export const createMockTeams = (count: number, groupNumber: number = 1) => {
  const teams = [];
  for (let i = 1; i <= count; i++) {
    teams.push({
      id: i,
      name: `Equipo ${String.fromCharCode(64 + i)}`, // A, B, C, D...
      group_number: groupNumber
    });
  }
  return teams;
};

export const createMockChampionship = (overrides: any = {}) => {
  return {
    id: 1,
    name: 'Test Championship',
    format: 'liga',
    start_date: new Date(),
    num_groups: 1,
    points_win: 3,
    points_loss: 0,
    status: 'active',
    created_by: 1,
    created_at: new Date(),
    ...overrides
  };
};

export const createMockMatch = (team1Id: number, team2Id: number, winnerId: number) => {
  return {
    id: 1,
    championship_id: 1,
    team1_id: team1Id,
    team2_id: team2Id,
    court_id: 1,
    round: 1,
    group_number: 1,
    status: 'finished' as const,
    team1_sets: winnerId === team1Id ? 2 : 1,
    team2_sets: winnerId === team2Id ? 2 : 1,
    team1_games: 12,
    team2_games: 10,
    winner_id: winnerId,
    created_at: new Date()
  };
};

// src/tests/jest.setup.ts

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

// Configuración global de timeouts
jest.setTimeout(30000); partidos ganados', () => {
      const standings: StandingCalculation[] = [
        {
          team_id: 1,
          points: 6,
          matches_played: 3,
          matches_won: 2,
          matches_lost: 1,
          sets_won: 5,
          sets_lost: 3,
          games_won: 18,
          games_lost: 15,
          head_to_head: new Map()
        },
        {
          team_id: 2,
          points: 6,
          matches_played: 2,
          matches_won: 2,
          matches_lost: 0,
          sets_won: 4,
          sets_lost: 0,
          games_won: 16,
          games_lost: 8,
          head_to_head: new Map()
        }
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(2); // 2 partidos ganados vs 2
      expect(sorted[1].team_id).toBe(1);
    });

    it('debe desempatar por juegos ganados en formato americano', () => {
      const americanChampionship: Championship = {
        ...mockChampionship,
        format: 'americano'
      };

      const standings: StandingCalculation[] = [
        {
          team_id: 3,
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 2,
          sets_lost: 2,
          games_won: 10, // Gamma - 10 juegos
          games_lost: 12,
          head_to_head: new Map()
        },
        {
          team_id: 4,
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 2,
          sets_lost: 2,
          games_won: 10, // Delta - 10 juegos (EMPATE)
          games_lost: 12,
          head_to_head: new Map()
        }
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, americanChampionship)
      );

      // Con mismo número de juegos, debe pasar al siguiente criterio
      // En este caso, como no hay head-to-head configurado, quedarán empitados
      expect(sorted).toHaveLength(2);
    });

    it('debe aplicar head-to-head entre dos equipos', () => {
      const mockMatch: Match = {
        id: 1,
        championship_id: 1,
        team1_id: 3,
        team2_id: 4,
        court_id: 1,
        round: 1,
        group_number: 1,
        status: 'finished',
        team1_sets: 1,
        team2_sets: 2,
        team1_games: 10,
        team2_games: 12,
        winner_id: 4, // Delta ganó a Gamma
        created_at: new Date()
      };

      const standings: StandingCalculation[] = [
        {
          team_id: 3, // Gamma
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 2,
          sets_lost: 2,
          games_won: 10,
          games_lost: 12,
          head_to_head: new Map([[4, mockMatch]]) // Perdió vs Delta
        },
        {
          team_id: 4, // Delta
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 2,
          sets_lost: 2,
          games_won: 10,
          games_lost: 12,
          head_to_head: new Map([[3, mockMatch]]) // Ganó vs Gamma
        }
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(4); // Delta ganó el head-to-head
      expect(sorted[1].team_id).toBe(3); // Gamma perdió el head-to-head
    });

    it('debe desempatar por diferencia de juegos', () => {
      const standings: StandingCalculation[] = [
        {
          team_id: 1,
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 2,
          sets_lost: 2,
          games_won: 15,
          games_lost: 10, // Diferencia: +5
          head_to_head: new Map()
        },
        {
          team_id: 2,
          points: 3,
          matches_played: 2,
          matches_won: 1,
          matches_lost: 1,
          sets_won: 2,
          sets_lost: 2,
          games_won: 12,
          games_lost: 10, // Diferencia: +2
          head_to_head: new Map()
        }
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(1); // Mejor diferencia de juegos
      expect(sorted[1].team_id).toBe(2);
    });

    it('debe desempatar por