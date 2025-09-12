// backend/src/tests/utils/testHelpers.ts

import { FixtureTeam, Championship, Match, StandingCalculation } from '../../types';

export const createMockTeams = (count: number, groupNumber: number = 1): FixtureTeam[] => {
  const teams: FixtureTeam[] = [];
  for (let i = 1; i <= count; i++) {
    teams.push({
      id: i,
      name: `Equipo ${String.fromCharCode(64 + i)}`, // A, B, C, D...
      group_number: groupNumber
    });
  }
  return teams;
};

export const createMockChampionship = (overrides: Partial<Championship> = {}): Championship => {
  return {
    id: 1,
    name: 'Test Championship',
    format: 'liga',
    start_date: new Date('2024-01-01'),
    num_groups: 1,
    points_win: 3,
    points_loss: 0,
    status: 'active',
    created_by: 1,
    created_at: new Date(),
    ...overrides
  };
};

export const createMockMatch = (
  id: number,
  team1Id: number,
  team2Id: number,
  winnerId: number,
  sets: Array<{ team1_games: number; team2_games: number }> = [{ team1_games: 6, team2_games: 4 }]
): Match => {
  const team1Games = sets.reduce((sum, set) => sum + set.team1_games, 0);
  const team2Games = sets.reduce((sum, set) => sum + set.team2_games, 0);
  const team1Sets = sets.filter(set => set.team1_games > set.team2_games).length;
  const team2Sets = sets.filter(set => set.team2_games > set.team1_games).length;

  return {
    id,
    championship_id: 1,
    team1_id: team1Id,
    team2_id: team2Id,
    court_id: 1,
    round: 1,
    group_number: 1,
    status: 'finished',
    team1_sets: team1Sets,
    team2_sets: team2Sets,
    team1_games: team1Games,
    team2_games: team2Games,
    winner_id: winnerId,
    created_at: new Date()
  };
};

export const createMockStanding = (
  teamId: number,
  stats: {
    points?: number;
    matchesWon?: number;
    matchesLost?: number;
    setsWon?: number;
    setsLost?: number;
    gamesWon?: number;
    gamesLost?: number;
  } = {},
  headToHead: Map<number, Match> = new Map()
): StandingCalculation => {
  const {
    points = 0,
    matchesWon = 0,
    matchesLost = 0,
    setsWon = 0,
    setsLost = 0,
    gamesWon = 0,
    gamesLost = 0
  } = stats;

  return {
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
  };
};

// Escenario específico 18/16/10/10
export const createCase181610Scenario = () => {
  const teams = [
    { id: 1, name: 'Alpha', group_number: 1 },
    { id: 2, name: 'Beta', group_number: 1 },
    { id: 3, name: 'Gamma', group_number: 1 },
    { id: 4, name: 'Delta', group_number: 1 }
  ];

  // Partidos con resultados específicos para generar 18/16/10/10
  const matches = [
    // Alpha vs Beta - Beta gana 2-1 (Alpha: 12 juegos, Beta: 14 juegos)
    createMockMatch(1, 1, 2, 2, [
      { team1_games: 6, team2_games: 4 }, // Alpha gana 1er set
      { team1_games: 3, team2_games: 6 }, // Beta gana 2do set
      { team1_games: 3, team2_games: 6 }  // Beta gana 3er set
    ]),

    // Alpha vs Gamma - Alpha gana 2-0 (Alpha: 12 juegos, Gamma: 6 juegos)
    createMockMatch(2, 1, 3, 1, [
      { team1_games: 6, team2_games: 3 },
      { team1_games: 6, team2_games: 3 }
    ]),

    // Alpha vs Delta - Alpha gana 2-1 (Alpha: 16 juegos total, Delta: 10)
    createMockMatch(3, 1, 4, 1, [
      { team1_games: 4, team2_games: 6 }, // Delta gana 1er set
      { team1_games: 6, team2_games: 2 }, // Alpha gana 2do set
      { team1_games: 6, team2_games: 2 }  // Alpha gana 3er set
    ]),

    // Beta vs Gamma - Gamma gana 2-1 (Beta: 16 total, Gamma: 14)
    createMockMatch(4, 2, 3, 3, [
      { team1_games: 6, team2_games: 4 }, // Beta gana 1er set
      { team1_games: 3, team2_games: 6 }, // Gamma gana 2do set
      { team1_games: 3, team2_games: 6 }  // Gamma gana 3er set
    ]),

    // Beta vs Delta - Beta gana 2-0 (Beta: 16 total, Delta: 10 total)
    createMockMatch(5, 2, 4, 2, [
      { team1_games: 6, team2_games: 2 },
      { team1_games: 6, team2_games: 2 }
    ]),

    // Gamma vs Delta - Delta gana 2-1 (Gamma: 10 total, Delta: 10 total - EMPATE!)
    createMockMatch(6, 3, 4, 4, [
      { team1_games: 6, team2_games: 4 }, // Gamma gana 1er set
      { team1_games: 2, team2_games: 6 }, // Delta gana 2do set
      { team1_games: 2, team2_games: 6 }  // Delta gana 3er set
    ])
  ];

  // Standings calculados esperados
  const expectedStandings = [
    createMockStanding(1, { // Alpha
      points: 6, matchesWon: 2, matchesLost: 1,
      setsWon: 4, setsLost: 3, gamesWon: 40, gamesLost: 28 // Total calculado
    }),
    createMockStanding(2, { // Beta
      points: 6, matchesWon: 2, matchesLost: 1,
      setsWon: 4, setsLost: 2, gamesWon: 32, gamesLost: 24
    }),
    createMockStanding(4, { // Delta (3er lugar por head-to-head)
      points: 3, matchesWon: 1, matchesLost: 2,
      setsWon: 3, setsLost: 4, gamesWon: 20, gamesLost: 28
    }),
    createMockStanding(3, { // Gamma (4to lugar por head-to-head)
      points: 3, matchesWon: 1, matchesLost: 2,
      setsWon: 3, setsLost: 4, gamesWon: 20, gamesLost: 28
    })
  ];

  return {
    teams,
    matches,
    expectedStandings,
    championship: createMockChampionship({
      name: 'Liga de Pádel Ejemplo - Caso 18/16/10/10'
    })
  };
};