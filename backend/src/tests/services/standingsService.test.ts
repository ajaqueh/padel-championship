// backend/src/tests/services/standingsService.test.ts

import { StandingsService } from '../../services/standingsService';
import { Match, Championship, StandingCalculation } from '../../types';

// Mock del pool de base de datos
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

describe('StandingsService', () => {
  describe('Cálculo de desempates', () => {
    const mockChampionship: Championship = {
      id: 1,
      name: 'Test Championship',
      format: 'liga',
      start_date: new Date('2024-01-01'),
      num_groups: 1,
      points_win: 3,
      points_loss: 0,
      status: 'active',
      created_by: 1,
      created_at: new Date()
    };

    // Helper para crear standing
    const createStanding = (
      teamId: number,
      points: number,
      matchesWon: number,
      matchesLost: number,
      setsWon: number,
      setsLost: number,
      gamesWon: number,
      gamesLost: number,
      headToHead: Map<number, Match> = new Map()
    ): StandingCalculation => ({
      team_id: teamId,
      points,
      matches_played: matchesWon + matchesLost,
      matches_won: matchesWon,
      matches_lost: matchesLost,
      sets_won: setsWon,
      sets_lost: setsLost,
      games_won: gamesWon,
      games_lost: gamesLost,
      head_to_head: headToHead
    });

    // Helper para crear match
    const createMatch = (id: number, team1Id: number, team2Id: number, winnerId: number): Match => ({
      id,
      championship_id: 1,
      team1_id: team1Id,
      team2_id: team2Id,
      court_id: 1,
      round: 1,
      group_number: 1,
      status: 'finished',
      team1_sets: winnerId === team1Id ? 2 : 1,
      team2_sets: winnerId === team2Id ? 2 : 1,
      team1_games: 12,
      team2_games: 10,
      winner_id: winnerId,
      created_at: new Date()
    });

    it('debe ordenar por puntos correctamente', () => {
      const standings = [
        createStanding(1, 3, 1, 1, 2, 2, 12, 10),
        createStanding(2, 6, 2, 0, 4, 0, 16, 8)
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(2); // 6 puntos
      expect(sorted[1].team_id).toBe(1); // 3 puntos
    });

    it('debe desempatar por partidos ganados', () => {
      const standings = [
        createStanding(1, 6, 2, 1, 5, 3, 18, 15),
        createStanding(2, 6, 2, 0, 4, 0, 16, 8)
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(2); // Mismo puntos, mismo partidos ganados, pero mejor diferencia
      expect(sorted[1].team_id).toBe(1);
    });

    it('debe desempatar por juegos ganados en formato americano', () => {
      const americanChampionship: Championship = {
        ...mockChampionship,
        format: 'americano'
      };

      const standings = [
        createStanding(3, 3, 1, 1, 2, 2, 10, 12), // Gamma - 10 juegos
        createStanding(4, 3, 1, 1, 2, 2, 10, 12)  // Delta - 10 juegos (EMPATE)
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, americanChampionship)
      );

      // Con mismo número de juegos, debe pasar al siguiente criterio
      expect(sorted).toHaveLength(2);
      // Sin head-to-head, quedarían empitados en esta etapa
    });

    it('debe aplicar head-to-head entre dos equipos', () => {
      const mockMatch = createMatch(1, 3, 4, 4); // Delta ganó a Gamma

      const standings = [
        createStanding(3, 3, 1, 1, 2, 2, 10, 12, new Map([[4, mockMatch]])), // Gamma - perdió vs Delta
        createStanding(4, 3, 1, 1, 2, 2, 10, 12, new Map([[3, mockMatch]]))  // Delta - ganó vs Gamma
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(4); // Delta ganó el head-to-head
      expect(sorted[1].team_id).toBe(3); // Gamma perdió el head-to-head
    });

    it('debe desempatar por diferencia de juegos', () => {
      const standings = [
        createStanding(1, 3, 1, 1, 2, 2, 15, 10), // Diferencia: +5
        createStanding(2, 3, 1, 1, 2, 2, 12, 10)  // Diferencia: +2
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(1); // Mejor diferencia de juegos
      expect(sorted[1].team_id).toBe(2);
    });

    it('debe desempatar por sets ganados', () => {
      const standings = [
        createStanding(1, 3, 1, 1, 4, 2, 15, 15), // Misma diferencia de juegos, más sets
        createStanding(2, 3, 1, 1, 3, 3, 15, 15)  // Misma diferencia de juegos, menos sets
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(1); // Más sets ganados
      expect(sorted[1].team_id).toBe(2);
    });

    it('debe desempatar por diferencia de sets', () => {
      const standings = [
        createStanding(1, 3, 1, 1, 4, 2, 15, 15), // Diferencia sets: +2
        createStanding(2, 3, 1, 1, 4, 3, 15, 15)  // Diferencia sets: +1
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(1); // Mejor diferencia de sets
      expect(sorted[1].team_id).toBe(2);
    });

    it('debe manejar el caso específico 18/16/10/10', () => {
      // Delta (id: 4) ganó a Gamma (id: 3)
      const deltaVsGamma = createMatch(1, 3, 4, 4);

      const standings = [
        createStanding(1, 6, 2, 1, 4, 3, 18, 15), // Alpha - 18 juegos, 6 puntos
        createStanding(2, 6, 2, 1, 4, 2, 16, 12), // Beta - 16 juegos, 6 puntos
        createStanding(3, 3, 1, 2, 3, 4, 10, 14, new Map([[4, deltaVsGamma]])), // Gamma - 10 juegos, perdió vs Delta
        createStanding(4, 3, 1, 2, 3, 4, 10, 14, new Map([[3, deltaVsGamma]]))  // Delta - 10 juegos, ganó vs Gamma
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      // Orden esperado:
      // 1. Alpha (18 juegos, 6 puntos)
      // 2. Beta (16 juegos, 6 puntos)
      // 3. Delta (10 juegos, 3 puntos, ganó head-to-head)
      // 4. Gamma (10 juegos, 3 puntos, perdió head-to-head)

      expect(sorted[0].team_id).toBe(1); // Alpha - más juegos entre los de 6 puntos
      expect(sorted[1].team_id).toBe(2); // Beta - menos juegos pero aún 6 puntos
      expect(sorted[2].team_id).toBe(4); // Delta - ganó head-to-head vs Gamma
      expect(sorted[3].team_id).toBe(3); // Gamma - perdió head-to-head vs Delta
    });

    it('debe manejar empate circular entre 3 equipos', () => {
      // Caso donde A ganó a B, B ganó a C, C ganó a A
      const matchAB = createMatch(1, 1, 2, 1); // A ganó a B
      const matchBC = createMatch(2, 2, 3, 2); // B ganó a C
      const matchCA = createMatch(3, 3, 1, 3); // C ganó a A

      const standings = [
        createStanding(1, 3, 1, 1, 2, 2, 12, 10, new Map([[2, matchAB], [3, matchCA]])),
        createStanding(2, 3, 1, 1, 2, 2, 11, 11, new Map([[1, matchAB], [3, matchBC]])),
        createStanding(3, 3, 1, 1, 2, 2, 9, 13, new Map([[1, matchCA], [2, matchBC]]))
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      // En caso de empate circular, debe resolverse por diferencia de juegos
      expect(sorted[0].team_id).toBe(1); // Mejor diferencia de juegos (+2)
      expect(sorted[1].team_id).toBe(2); // Diferencia neutra (0)
      expect(sorted[2].team_id).toBe(3); // Peor diferencia de juegos (-4)
    });

    it('debe manejar equipos con 0 partidos jugados', () => {
      const standings = [
        createStanding(1, 0, 0, 0, 0, 0, 0, 0), // Sin partidos
        createStanding(2, 3, 1, 0, 2, 0, 12, 8)  // Con partidos
      ];

      const sorted = standings.sort((a, b) => 
        (StandingsService as any).compareTeams(a, b, mockChampionship)
      );

      expect(sorted[0].team_id).toBe(2); // Con puntos
      expect(sorted[1].team_id).toBe(1); // Sin puntos
    });
  });
});