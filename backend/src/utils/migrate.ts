// src/utils/migrate.ts

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'padel_championship',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const migrations = [
  // Migration 1: Create users table
  `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'gestor')),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Migration 2: Create championships table
  `
  CREATE TABLE IF NOT EXISTS championships (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    format VARCHAR(20) NOT NULL CHECK (format IN ('liga', 'torneo', 'americano')),
    start_date DATE NOT NULL,
    end_date DATE,
    num_groups INTEGER DEFAULT 1,
    points_win INTEGER DEFAULT 3,
    points_loss INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finished')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Migration 3: Create courts table
  `
  CREATE TABLE IF NOT EXISTS courts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Migration 4: Create teams table
  `
  CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    player1_name VARCHAR(255) NOT NULL,
    player2_name VARCHAR(255) NOT NULL,
    championship_id INTEGER REFERENCES championships(id) ON DELETE CASCADE,
    group_number INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Migration 5: Create matches table
  `
  CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    championship_id INTEGER REFERENCES championships(id) ON DELETE CASCADE,
    team1_id INTEGER REFERENCES teams(id),
    team2_id INTEGER REFERENCES teams(id),
    court_id INTEGER REFERENCES courts(id),
    round INTEGER NOT NULL,
    group_number INTEGER DEFAULT 1,
    scheduled_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'playing', 'finished')),
    team1_sets INTEGER DEFAULT 0,
    team2_sets INTEGER DEFAULT 0,
    team1_games INTEGER DEFAULT 0,
    team2_games INTEGER DEFAULT 0,
    winner_id INTEGER REFERENCES teams(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Migration 6: Create match_sets table
  `
  CREATE TABLE IF NOT EXISTS match_sets (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    team1_games INTEGER NOT NULL,
    team2_games INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  
  // Migration 7: Create standings table
  `
  CREATE TABLE IF NOT EXISTS standings (
    id SERIAL PRIMARY KEY,
    championship_id INTEGER REFERENCES championships(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    group_number INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    sets_won INTEGER DEFAULT 0,
    sets_lost INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(championship_id, team_id)
  );
  `,
  
  // Migration 8: Create indexes for performance
  `
  CREATE INDEX IF NOT EXISTS idx_championships_created_by ON championships(created_by);
  CREATE INDEX IF NOT EXISTS idx_teams_championship ON teams(championship_id);
  CREATE INDEX IF NOT EXISTS idx_matches_championship ON matches(championship_id);
  CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(team1_id, team2_id);
  CREATE INDEX IF NOT EXISTS idx_standings_championship ON standings(championship_id);
  CREATE INDEX IF NOT EXISTS idx_standings_position ON standings(championship_id, position);
  `
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Ejecutando migraciones...');
    
    for (let i = 0; i < migrations.length; i++) {
      console.log(`⏳ Ejecutando migración ${i + 1}/${migrations.length}...`);
      await client.query(migrations[i]);
      console.log(`✅ Migración ${i + 1} completada`);
    }
    
    console.log('🎉 Todas las migraciones completadas exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migraciones si este archivo se ejecuta directamente
if (require.main === module) {
  runMigrations().catch(console.error);
}

export { runMigrations };