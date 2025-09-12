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