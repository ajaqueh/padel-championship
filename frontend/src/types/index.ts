export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'gestor';
}

export interface Championship {
  id: number;
  name: string;
  format: 'liga' | 'torneo' | 'americano';
  start_date: string;
  end_date?: string;
  num_groups: number;
  points_win: number;
  points_loss: number;
  status: 'draft' | 'active' | 'finished';
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  player1_name: string;
  player2_name: string;
  championship_id: number;
  group_number: number;
  created_at: string;
}

export interface Match {
  id: number;
  championship_id: number;
  team1_id: number;
  team2_id: number;
  court_id?: number;
  round: number;
  group_number: number;
  scheduled_date?: string;
  status: 'pending' | 'playing' | 'finished';
  team1_sets: number;
  team2_sets: number;
  team1_games: number;
  team2_games: number;
  winner_id?: number;
  team1_name?: string;
  team2_name?: string;
  court_name?: string;
  sets?: MatchSet[];
}

export interface MatchSet {
  id: number;
  match_id: number;
  set_number: number;
  team1_games: number;
  team2_games: number;
}

export interface Standing {
  id: number;
  championship_id: number;
  team_id: number;
  group_number: number;
  points: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  position: number;
  team_name: string;
  player1_name: string;
  player2_name: string;
  updated_at: string;
}

export interface Court {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

export interface StandingsResponse {
  standings: Standing[];
  updated_at: string;
}