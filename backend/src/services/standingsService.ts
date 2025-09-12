// src/services/standingsService.ts

import { Match, Championship, StandingCalculation, StandingWithTeam } from '../types';
import { pool } from '../types';

export class StandingsService {
  /**
   * Calcula las posiciones de un campeonato
   */
  public static async calculateStandings(
    championshipId: number
  ): Promise<StandingWithTeam[]> {
    // Obtener datos del campeonato
    const championship = await this.getChampionship(championshipId);
    const matches = await this.getFinishedMatches(championshipId);
    const teams = await this.getTeams(championshipId);

    // Inicializar standings
    const standings: Map<number, StandingCalculation> = new Map();
    
    teams.forEach(team => {
      standings.set(team.id, {
        team_id: team.id,
        points: 0,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        sets_won: 0,
        sets_lost: 0,
        games_won: 0,
        games_lost: 0,
        head_to_head: new Map()
      });
    });

    // Procesar partidos
    matches.forEach(match => {
      const team1Standing = standings.get(match.team1_id)!;
      const team2Standing = standings.get(match.team2_id)!;

      // Actualizar estadísticas básicas
      team1Standing.matches_played++;
      team2Standing.matches_played++;

      team1Standing.sets_won += match.team1_sets;
      team1Standing.sets_lost += match.team2_sets;
      team2Standing.sets_won += match.team2_sets;
      team2Standing.sets_lost += match.team1_sets;

      team1Standing.games_won += match.team1_games;
      team1Standing.games_lost += match.team2_games;
      team2Standing.games_won += match.team2_games;
      team2Standing.games_lost += match.team1_games;

      // Determinar ganador y actualizar puntos
      if (match.winner_id === match.team1_id) {
        team1Standing.matches_won++;
        team2Standing.matches_lost++;
        team1Standing.points += championship.points_win;
        team2Standing.points += championship.points_loss;
      } else if (match.winner_id === match.team2_id) {
        team2Standing.matches_won++;
        team1Standing.matches_lost++;
        team2Standing.points += championship.points_win;
        team1Standing.points += championship.points_loss;
      }

      // Actualizar head-to-head
      team1Standing.head_to_head.set(match.team2_id, match);
      team2Standing.head_to_head.set(match.team1_id, match);
    });

    // Convertir a array y ordenar
    const standingsArray = Array.from(standings.values());
    const sortedStandings = this.sortStandings(standingsArray, championship);

    // Guardar en base de datos y devolver con información de equipos
    await this.saveStandings(championshipId, sortedStandings);
    return this.getStandingsWithTeamInfo(championshipId);
  }

  /**
   * Ordena los standings aplicando todas las reglas de desempate
   */
  private static sortStandings(
    standings: StandingCalculation[],
    championship: Championship
  ): StandingCalculation[] {
    // Agrupar por grupo si es necesario
    const groups = new Map<number, StandingCalculation[]>();
    
    standings.forEach(standing => {
      // Asumimos group_number 1 por defecto para liga simple
      const groupNumber = 1; // En Release 2 se obtendría de la DB
      if (!groups.has(groupNumber)) {
        groups.set(groupNumber, []);
      }
      groups.get(groupNumber)!.push(standing);
    });

    const sortedStandings: StandingCalculation[] = [];

    // Ordenar cada grupo
    for (const groupStandings of groups.values()) {
      const sorted = groupStandings.sort((a, b) => 
        this.compareTeams(a, b, championship)
      );
      sortedStandings.push(...sorted);
    }

    return sortedStandings;
  }

  /**
   * Compara dos equipos aplicando todas las reglas de desempate
   */
  private static compareTeams(
    a: StandingCalculation,
    b: StandingCalculation,
    championship: Championship
  ): number {
    // 1. Puntos
    if (a.points !== b.points) {
      return b.points - a.points;
    }

    // 2. Partidos ganados
    if (a.matches_won !== b.matches_won) {
      return b.matches_won - a.matches_won;
    }

    // 3. Para formato americano: total juegos ganados
    if (championship.format === 'americano') {
      if (a.games_won !== b.games_won) {
        return b.games_won - a.games_won;
      }
    }

    // 4. Head-to-head
    const h2hResult = this.resolveHeadToHead([a, b]);
    if (h2hResult.length === 1) {
      return h2hResult[0].team_id === a.team_id ? -1 : 1;
    }

    // 5. Diferencia de juegos
    const aDiff = a.games_won - a.games_lost;
    const bDiff = b.games_won - b.games_lost;
    if (aDiff !== bDiff) {
      return bDiff - aDiff;
    }

    // 6. Sets ganados
    if (a.sets_won !== b.sets_won) {
      return b.sets_won - a.sets_won;
    }

    // 7. Diferencia de sets
    const aSetsDiff = a.sets_won - a.sets_lost;
    const bSetsDiff = b.sets_won - b.sets_lost;
    if (aSetsDiff !== bSetsDiff) {
      return bSetsDiff - aSetsDiff;
    }

    return 0; // Empate total
  }

  /**
   * Resuelve el head-to-head entre equipos empatados
   */
  private static resolveHeadToHead(
    teams: StandingCalculation[]
  ): StandingCalculation[] {
    if (teams.length !== 2) {
      // Para más de 2 equipos, implementar lógica circular en Release 2
      return [];
    }

    const [teamA, teamB] = teams;
    const matchAvsB = teamA.head_to_head.get(teamB.team_id);

    if (!matchAvsB) {
      return []; // No se enfrentaron
    }

    if (matchAvsB.winner_id === teamA.team_id) {
      return [teamA];
    } else if (matchAvsB.winner_id === teamB.team_id) {
      return [teamB];
    }

    return []; // Empate en el head-to-head
  }

  // Helper methods para base de datos
  private static async getChampionship(championshipId: number): Promise<Championship> {
    const result = await pool.query(
      'SELECT * FROM championships WHERE id = $1',
      [championshipId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Campeonato no encontrado');
    }

    return result.rows[0];
  }

  private static async getFinishedMatches(championshipId: number): Promise<Match[]> {
    const result = await pool.query(
      'SELECT * FROM matches WHERE championship_id = $1 AND status = $2',
      [championshipId, 'finished']
    );
    
    return result.rows;
  }

  private static async getTeams(championshipId: number) {
    const result = await pool.query(
      'SELECT * FROM teams WHERE championship_id = $1',
      [championshipId]
    );
    
    return result.rows;
  }

  private static async saveStandings(
    championshipId: number,
    standings: StandingCalculation[]
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Eliminar standings previos
      await client.query(
        'DELETE FROM standings WHERE championship_id = $1',
        [championshipId]
      );

      // Insertar nuevos standings
      for (let i = 0; i < standings.length; i++) {
        const standing = standings[i];
        await client.query(
          `INSERT INTO standings (
            championship_id, team_id, group_number, points,
            matches_played, matches_won, matches_lost,
            sets_won, sets_lost, games_won, games_lost, position
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            championshipId,
            standing.team_id,
            1, // group_number por defecto
            standing.points,
            standing.matches_played,
            standing.matches_won,
            standing.matches_lost,
            standing.sets_won,
            standing.sets_lost,
            standing.games_won,
            standing.games_lost,
            i + 1 // position
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private static async getStandingsWithTeamInfo(
    championshipId: number
  ): Promise<StandingWithTeam[]> {
    const result = await pool.query(
      `SELECT s.*, t.name as team_name, t.player1_name, t.player2_name
       FROM standings s
       JOIN teams t ON s.team_id = t.id
       WHERE s.championship_id = $1
       ORDER BY s.position`,
      [championshipId]
    );

    return result.rows;
  }
}