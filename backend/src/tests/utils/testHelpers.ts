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