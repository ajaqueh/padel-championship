// src/types/index.ts

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin' | 'gestor';
  name: string;
  created_at: Date;
}

export interface Championship {
  id: number;
  name: string;
  format: 'liga' | 'torneo' | 'americano';
  start_date: Date;
  end_date?: Date;
  num_groups: number;
  points_win: number;
  points_loss: number;
  status: 'draft' | 'active' | 'finished';
  created_by: number;
  created_at: Date;
}

export interface Team {
  id: number;
  name: string;
  player1_name: string;
  player2_name: string;
  championship_id: number;
  group_number: number;
  created_at: Date;
}

export interface Court {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
}

export interface Match {
  id: number;
  championship_id: number;
  team1_id: number;
  team2_id: number;
  court_id?: number;
  round: number;
  group_number: number;
  scheduled_date?: Date;
  status: 'pending' | 'playing' | 'finished';
  team1_sets: number;
  team2_sets: number;
  team1_games: number;
  team2_games: number;
  winner_id?: number;
  created_at: Date;
}

export interface MatchSet {
  id: number;
  match_id: number;
  set_number: number;
  team1_games: number;
  team2_games: number;
  created_at: Date;
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
  updated_at: Date;
}

export interface StandingWithTeam extends Standing {
  team_name: string;
  player1_name: string;
  player2_name: string;
}

// Request/Response types
export interface CreateChampionshipRequest {
  name: string;
  format: 'liga' | 'torneo' | 'americano';
  start_date: string;
  end_date?: string;
  num_groups?: number;
  points_win?: number;
  points_loss?: number;
}

export interface CreateTeamRequest {
  name: string;
  player1_name: string;
  player2_name: string;
  group_number?: number;
}

export interface CreateMatchRequest {
  team1_id: number;
  team2_id: number;
  court_id?: number;
  round: number;
  group_number?: number;
  scheduled_date?: string;
}

export interface UpdateMatchResultRequest {
  sets: Array<{
    team1_games: number;
    team2_games: number;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'gestor';
}

// Utility types for algorithms
export interface FixtureTeam {
  id: number;
  name: string;
  group_number: number;
}

export interface GeneratedMatch {
  team1_id: number;
  team2_id: number;
  round: number;
  group_number: number;
}

export interface StandingCalculation {
  team_id: number;
  points: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  head_to_head: Map<number, Match>;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

// Database connection
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'padel_championship',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export { pool };