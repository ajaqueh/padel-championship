// src/controllers/matchController.ts

import { Request, Response, NextFunction } from 'express';
import { pool } from '../types';
import { AppError, CreateMatchRequest, UpdateMatchResultRequest } from '../types';
import { StandingsService } from '../services/standingsService';

export class MatchController {
  public static async getByChampionship(req: Request, res: Response, next: NextFunction) {
    try {
      const { championshipId } = req.params;

      const result = await pool.query(
        `SELECT 
          m.*,
          t1.name as team1_name,
          t1.player1_name as team1_player1,
          t1.player2_name as team1_player2,
          t2.name as team2_name,
          t2.player1_name as team2_player1,
          t2.player2_name as team2_player2,
          c.name as court_name
         FROM matches m
         JOIN teams t1 ON m.team1_id = t1.id
         JOIN teams t2 ON m.team2_id = t2.id
         LEFT JOIN courts c ON m.court_id = c.id
         WHERE m.championship_id = $1
         ORDER BY m.round, m.group_number, m.id`,
        [championshipId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          m.*,
          t1.name as team1_name,
          t1.player1_name as team1_player1,
          t1.player2_name as team1_player2,
          t2.name as team2_name,
          t2.player1_name as team2_player1,
          t2.player2_name as team2_player2,
          c.name as court_name
         FROM matches m
         JOIN teams t1 ON m.team1_id = t1.id
         JOIN teams t2 ON m.team2_id = t2.id
         LEFT JOIN courts c ON m.court_id = c.id
         WHERE m.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Partido no encontrado', 404);
      }

      // Obtener sets del partido
      const setsResult = await pool.query(
        'SELECT * FROM match_sets WHERE match_id = $1 ORDER BY set_number',
        [id]
      );

      const match = result.rows[0];
      match.sets = setsResult.rows;

      res.json(match);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        team1_id,
        team2_id,
        court_id,
        round,
        group_number = 1,
        scheduled_date
      }: CreateMatchRequest = req.body;

      // Verificar que los equipos existen
      const teamsResult = await pool.query(
        'SELECT id, championship_id FROM teams WHERE id IN ($1, $2)',
        [team1_id, team2_id]
      );

      if (teamsResult.rows.length !== 2) {
        throw new AppError('Uno o ambos equipos no existen', 400);
      }

      const championship_id = teamsResult.rows[0].championship_id;

      // Verificar que ambos equipos pertenecen al mismo campeonato
      if (teamsResult.rows[0].championship_id !== teamsResult.rows[1].championship_id) {
        throw new AppError('Los equipos deben pertenecer al mismo campeonato', 400);
      }

      const result = await pool.query(
        `INSERT INTO matches (
          championship_id, team1_id, team2_id, court_id, round, group_number, scheduled_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [championship_id, team1_id, team2_id, court_id, round, group_number, scheduled_date]
      );

      res.status(201).json({
        message: 'Partido creado exitosamente',
        match: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await pool.query(
        `UPDATE matches SET 
         court_id = COALESCE($1, court_id),
         scheduled_date = COALESCE($2, scheduled_date),
         status = COALESCE($3, status)
         WHERE id = $4 RETURNING *`,
        [updateData.court_id, updateData.scheduled_date, updateData.status, id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Partido no encontrado', 404);
      }

      res.json({
        message: 'Partido actualizado exitosamente',
        match: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM matches WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Partido no encontrado', 404);
      }

      res.json({
        message: 'Partido eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { sets }: UpdateMatchResultRequest = req.body;

      if (!sets || sets.length === 0) {
        throw new AppError('Se requiere al menos un set', 400);
      }

      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Obtener información del partido
        const matchResult = await client.query(
          'SELECT * FROM matches WHERE id = $1',
          [id]
        );

        if (matchResult.rows.length === 0) {
          throw new AppError('Partido no encontrado', 404);
        }

        const match = matchResult.rows[0];

        // Calcular estadísticas del partido
        let team1Sets = 0;
        let team2Sets = 0;
        let team1Games = 0;
        let team2Games = 0;

        // Eliminar sets anteriores
        await client.query('DELETE FROM match_sets WHERE match_id = $1', [id]);

        // Procesar cada set
        for (let i = 0; i < sets.length; i++) {
          const set = sets[i];
          
          // Validar que el set tenga un ganador claro
          if (set.team1_games < 6 && set.team2_games < 6) {
            throw new AppError(`Set ${i + 1}: Debe haber un ganador (mínimo 6 juegos)`, 400);
          }

          // Determinar ganador del set
          if (set.team1_games > set.team2_games) {
            team1Sets++;
          } else {
            team2Sets++;
          }

          team1Games += set.team1_games;
          team2Games += set.team2_games;

          // Guardar set en la base de datos
          await client.query(
            'INSERT INTO match_sets (match_id, set_number, team1_games, team2_games) VALUES ($1, $2, $3, $4)',
            [id, i + 1, set.team1_games, set.team2_games]
          );
        }

        // Determinar ganador del partido
        let winnerId: number | null = null;
        if (team1Sets > team2Sets) {
          winnerId = match.team1_id;
        } else if (team2Sets > team1Sets) {
          winnerId = match.team2_id;
        }

        // Actualizar partido
        await client.query(
          `UPDATE matches SET 
           team1_sets = $1, 
           team2_sets = $2, 
           team1_games = $3, 
           team2_games = $4, 
           winner_id = $5,
           status = 'finished'
           WHERE id = $6`,
          [team1Sets, team2Sets, team1Games, team2Games, winnerId, id]
        );

        await client.query('COMMIT');

        // Recalcular standings del campeonato
        await StandingsService.calculateStandings(match.championship_id);

        res.json({
          message: 'Resultado actualizado exitosamente',
          match: {
            id: parseInt(id),
            team1_sets: team1Sets,
            team2_sets: team2Sets,
            team1_games: team1Games,
            team2_games: team2Games,
            winner_id: winnerId,
            status: 'finished'
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }
}