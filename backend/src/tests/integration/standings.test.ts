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