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