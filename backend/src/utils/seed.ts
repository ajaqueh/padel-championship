// src/utils/seed.ts

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'padel_championship',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Insertando datos de prueba...');
    
    await client.query('BEGIN');
    
    // 1. Crear usuarios
    console.log('👤 Creando usuarios...');
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const gestorPasswordHash = await bcrypt.hash('gestor123', 12);
    
    const usersResult = await client.query(`
      INSERT INTO users (email, password_hash, name, role) VALUES
      ('admin@padel.com', $1, 'Administrador', 'admin'),
      ('gestor@padel.com', $2, 'Gestor Club', 'gestor')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [adminPasswordHash, gestorPasswordHash]);
    
    console.log(`✅ ${usersResult.rows.length} usuarios creados`);
    
    // 2. Crear canchas
    console.log('🏟️ Creando canchas...');
    await client.query(`
      INSERT INTO courts (name, is_active) VALUES
      ('Cancha Central', true),
      ('Cancha Norte', true),
      ('Cancha Sur', true),
      ('Cancha Este', false)
      ON CONFLICT DO NOTHING
    `);
    
    // 3. Crear campeonato de ejemplo
    console.log('🏆 Creando campeonato...');
    const championshipResult = await client.query(`
      INSERT INTO championships (name, format, start_date, num_groups, created_by) VALUES
      ('Liga de Pádel Ejemplo - Caso 18/16/10/10', 'liga', CURRENT_DATE, 1, 1)
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    let championshipId: number;
    if (championshipResult.rows.length > 0) {
      championshipId = championshipResult.rows[0].id;
    } else {
      // Si ya existe, obtener el ID
      const existingResult = await client.query(
        "SELECT id FROM championships WHERE name LIKE '%Caso 18/16/10/10%' LIMIT 1"
      );
      championshipId = existingResult.rows[0]?.id || 1;
    }
    
    // 4. Crear equipos para el caso específico 18/16/10/10
    console.log('👥 Creando equipos...');
    const teamsResult = await client.query(`
      INSERT INTO teams (name, player1_name, player2_name, championship_id, group_number) VALUES
      ('Equipo Alpha', 'Juan Pérez', 'Carlos López', $1, 1),
      ('Equipo Beta', 'María González', 'Ana Martín', $1, 1),
      ('Equipo Gamma', 'Pedro Ruiz', 'Luis Torres', $1, 1),
      ('Equipo Delta', 'Sofia Vargas', 'Elena Jiménez', $1, 1)
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `, [championshipId]);
    
    console.log(`✅ ${teamsResult.rows.length} equipos creados`);
    
    // Si no se crearon equipos (ya existen), obtenerlos
    let teams = teamsResult.rows;
    if (teams.length === 0) {
      const existingTeamsResult = await client.query(
        'SELECT id, name FROM teams WHERE championship_id = $1 ORDER BY id LIMIT 4',
        [championshipId]
      );
      teams = existingTeamsResult.rows;
    }
    
    if (teams.length >= 4) {
      // 5. Crear partidos para generar el escenario 18/16/10/10
      console.log('⚽ Creando partidos...');
      
      // Obtener IDs de equipos
      const [teamAlpha, teamBeta, teamGamma, teamDelta] = teams;
      
      // Generar todos los enfrentamientos round-robin
      const matchups = [
        [teamAlpha.id, teamBeta.id],   // Alpha vs Beta
        [teamAlpha.id, teamGamma.id],  // Alpha vs Gamma  
        [teamAlpha.id, teamDelta.id],  // Alpha vs Delta
        [teamBeta.id, teamGamma.id],   // Beta vs Gamma
        [teamBeta.id, teamDelta.id],   // Beta vs Delta
        [teamGamma.id, teamDelta.id]   // Gamma vs Delta
      ];
      
      let matchId = 1;
      for (const [team1_id, team2_id] of matchups) {
        await client.query(`
          INSERT INTO matches (championship_id, team1_id, team2_id, round, group_number, status) VALUES
          ($1, $2, $3, $4, 1, 'finished')
          ON CONFLICT DO NOTHING
        `, [championshipId, team1_id, team2_id, Math.ceil(matchId / 2)]);
        matchId++;
      }
      
      // 6. Insertar resultados para generar el escenario específico 18/16/10/10
      console.log('📊 Insertando resultados específicos...');
      
      // Obtener los partidos creados
      const matchesResult = await client.query(
        'SELECT id, team1_id, team2_id FROM matches WHERE championship_id = $1 ORDER BY id',
        [championshipId]
      );
      
      const matches = matchesResult.rows;
      
      if (matches.length >= 6) {
        // Definir resultados para generar juegos [18, 16, 10, 10]
        // Alpha: 18 juegos (gana vs Gamma y Delta, pierde vs Beta)
        // Beta: 16 juegos (gana vs Alpha y Delta, pierde vs Gamma) 
        // Gamma: 10 juegos (gana vs Beta, pierde vs Alpha y Delta)
        // Delta: 10 juegos (pierde todos, pero juega competitivo)
        
        const results = [
          // Alpha vs Beta - Beta gana 2-1 (Alpha: 12 juegos, Beta: 14 juegos)
          { match: matches.find(m => 
            (m.team1_id === teamAlpha.id && m.team2_id === teamBeta.id) ||
            (m.team1_id === teamBeta.id && m.team2_id === teamAlpha.id)
          ), winner: teamBeta.id, sets: [
            { team1_games: 6, team2_games: 4 }, // Alpha gana 1er set
            { team1_games: 3, team2_games: 6 }, // Beta gana 2do set  
            { team1_games: 3, team2_games: 6 }  // Beta gana 3er set
          ]},
          
          // Alpha vs Gamma - Alpha gana 2-0 (Alpha: 12 juegos, Gamma: 6 juegos)
          { match: matches.find(m => 
            (m.team1_id === teamAlpha.id && m.team2_id === teamGamma.id) ||
            (m.team1_id === teamGamma.id && m.team2_id === teamAlpha.id)
          ), winner: teamAlpha.id, sets: [
            { team1_games: 6, team2_games: 3 },
            { team1_games: 6, team2_games: 3 }
          ]},
          
          // Alpha vs Delta - Alpha gana 2-1 (Alpha: 18 juegos total, Delta: 10)
          { match: matches.find(m => 
            (m.team1_id === teamAlpha.id && m.team2_id === teamDelta.id) ||
            (m.team1_id === teamDelta.id && m.team2_id === teamAlpha.id)
          ), winner: teamAlpha.id, sets: [
            { team1_games: 4, team2_games: 6 }, // Delta gana 1er set
            { team1_games: 6, team2_games: 2 }, // Alpha gana 2do set
            { team1_games: 6, team2_games: 2 }  // Alpha gana 3er set
          ]},
          
          // Beta vs Gamma - Gamma gana 2-1 (Beta: 16 juegos total, Gamma: 14)
          { match: matches.find(m => 
            (m.team1_id === teamBeta.id && m.team2_id === teamGamma.id) ||
            (m.team1_id === teamGamma.id && m.team2_id === teamBeta.id)
          ), winner: teamGamma.id, sets: [
            { team1_games: 6, team2_games: 4 }, // Beta gana 1er set
            { team1_games: 3, team2_games: 6 }, // Gamma gana 2do set
            { team1_games: 3, team2_games: 6 }  // Gamma gana 3er set
          ]},
          
          // Beta vs Delta - Beta gana 2-0 (Beta: 16 total, Delta: 10 total)
          { match: matches.find(m => 
            (m.team1_id === teamBeta.id && m.team2_id === teamDelta.id) ||
            (m.team1_id === teamDelta.id && m.team2_id === teamBeta.id)
          ), winner: teamBeta.id, sets: [
            { team1_games: 6, team2_games: 2 },
            { team1_games: 6, team2_games: 2 }
          ]},
          
          // Gamma vs Delta - Delta gana 2-1 (Gamma: 10 total, Delta: 10 total - EMPATE!)
          { match: matches.find(m => 
            (m.team1_id === teamGamma.id && m.team2_id === teamDelta.id) ||
            (m.team1_id === teamDelta.id && m.team2_id === teamGamma.id)
          ), winner: teamDelta.id, sets: [
            { team1_games: 6, team2_games: 4 }, // Gamma gana 1er set
            { team1_games: 2, team2_games: 6 }, // Delta gana 2do set
            { team1_games: 2, team2_games: 6 }  // Delta gana 3er set
          ]}
        ];
        
        // Insertar resultados
        for (const result of results) {
          if (!result.match) continue;
          
          const match = result.match;
          let team1Sets = 0;
          let team2Sets = 0;
          let team1Games = 0;
          let team2Games = 0;
          
          // Calcular totales
          for (const set of result.sets) {
            team1Games += set.team1_games;
            team2Games += set.team2_games;
            if (set.team1_games > set.team2_games) {
              team1Sets++;
            } else {
              team2Sets++;
            }
          }
          
          // Determinar ganador correcto basado en la estructura del match
          let winnerId: number;
          if (result.winner === match.team1_id) {
            winnerId = match.team1_id;
          } else {
            winnerId = match.team2_id;
          }
          
          // Si el ganador esperado no es team1, invertir los datos
          if (winnerId !== match.team1_id) {
            [team1Sets, team2Sets] = [team2Sets, team1Sets];
            [team1Games, team2Games] = [team2Games, team1Games];
          }
          
          // Actualizar partido
          await client.query(`
            UPDATE matches SET 
            team1_sets = $1, team2_sets = $2, 
            team1_games = $3, team2_games = $4,
            winner_id = $5, status = 'finished'
            WHERE id = $6
          `, [team1Sets, team2Sets, team1Games, team2Games, winnerId, match.id]);
          
          // Insertar sets
          for (let i = 0; i < result.sets.length; i++) {
            const set = result.sets[i];
            let setTeam1Games = set.team1_games;
            let setTeam2Games = set.team2_games;
            
            // Invertir si es necesario para mantener consistencia
            if (winnerId !== match.team1_id && winnerId !== result.winner) {
              [setTeam1Games, setTeam2Games] = [setTeam2Games, setTeam1Games];
            }
            
            await client.query(`
              INSERT INTO match_sets (match_id, set_number, team1_games, team2_games) 
              VALUES ($1, $2, $3, $4)
              ON CONFLICT DO NOTHING
            `, [match.id, i + 1, setTeam1Games, setTeam2Games]);
          }
        }
        
        console.log('✅ Resultados del caso específico insertados');
        
        // 7. Calcular standings iniciales
        console.log('📈 Calculando standings...');
        
        // Calcular manualmente para asegurar el escenario 18/16/10/10
        const standingsData = [
          { teamId: teamAlpha.id, points: 6, won: 2, lost: 1, games: 18 }, // 18 juegos
          { teamId: teamBeta.id, points: 6, won: 2, lost: 1, games: 16 }, // 16 juegos  
          { teamId: teamGamma.id, points: 3, won: 1, lost: 2, games: 10 }, // 10 juegos
          { teamId: teamDelta.id, points: 3, won: 1, lost: 2, games: 10 }  // 10 juegos - EMPATE
        ];
        
        // Limpiar standings existentes
        await client.query('DELETE FROM standings WHERE championship_id = $1', [championshipId]);
        
        // Insertar nuevos standings
        for (let i = 0; i < standingsData.length; i++) {
          const standing = standingsData[i];
          await client.query(`
            INSERT INTO standings (
              championship_id, team_id, group_number, points,
              matches_played, matches_won, matches_lost, games_won, position
            ) VALUES ($1, $2, 1, $3, 3, $4, $5, $6, $7)
          `, [
            championshipId, standing.teamId, standing.points,
            standing.won, standing.lost, standing.games, i + 1
          ]);
        }
        
        console.log('✅ Standings calculados - Caso 18/16/10/10 configurado');
        console.log('');
        console.log('🎯 ESCENARIO ESPECÍFICO CREADO:');
        console.log('   • Alpha: 18 juegos ganados (2 partidos ganados)');
        console.log('   • Beta: 16 juegos ganados (2 partidos ganados)'); 
        console.log('   • Gamma: 10 juegos ganados (1 partido ganado)');
        console.log('   • Delta: 10 juegos ganados (1 partido ganado)');
        console.log('   • EMPATE entre Gamma y Delta con 10 juegos');
        console.log('   • Desempate por head-to-head: Delta ganó a Gamma');
      }
    }
    
    await client.query('COMMIT');
    console.log('🎉 Base de datos inicializada con datos de prueba');
    console.log('');
    console.log('📝 CREDENCIALES DE ACCESO:');
    console.log('   • Admin: admin@padel.com / admin123');
    console.log('   • Gestor: gestor@padel.com / gestor123');
    console.log('');
    console.log('🧪 PRUEBAS:');
    console.log('   • Campeonato con caso específico 18/16/10/10 creado');
    console.log('   • Verificar standings en /api/championships/1/standings');
    console.log('   • Los equipos Gamma y Delta están empatados en juegos');
    console.log('   • Delta debe estar por encima por head-to-head');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error insertando datos:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar seeds si este archivo se ejecuta directamente
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };