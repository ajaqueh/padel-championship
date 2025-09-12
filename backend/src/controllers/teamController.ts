// src/controllers/teamController.ts

import { Request, Response, NextFunction } from 'express';
import { pool } from '../types';
import { AppError, CreateTeamRequest } from '../types';

export class TeamController {
  public static async getByChampionship(req: Request, res: Response, next: NextFunction) {
    try {
      const { championshipId } = req.params;

      const result = await pool.query(
        'SELECT * FROM teams WHERE championship_id = $1 ORDER BY group_number, name',
        [championshipId]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { championshipId } = req.params;
      const { name, player1_name, player2_name, group_number = 1 }: CreateTeamRequest = req.body;

      const result = await pool.query(
        `INSERT INTO teams (name, player1_name, player2_name, championship_id, group_number)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, player1_name, player2_name, championshipId, group_number]
      );

      res.status(201).json({
        message: 'Equipo creado exitosamente',
        team: result.rows[0]
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
        `UPDATE teams SET 
         name = COALESCE($1, name),
         player1_name = COALESCE($2, player1_name),
         player2_name = COALESCE($3, player2_name),
         group_number = COALESCE($4, group_number)
         WHERE id = $5 RETURNING *`,
        [updateData.name, updateData.player1_name, updateData.player2_name, 
         updateData.group_number, id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Equipo no encontrado', 404);
      }

      res.json({
        message: 'Equipo actualizado exitosamente',
        team: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM teams WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Equipo no encontrado', 404);
      }

      res.json({
        message: 'Equipo eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  public static async importCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { championshipId } = req.params;
      
      if (!req.file) {
        throw new AppError('No se proporcionó archivo CSV', 400);
      }

      // Aquí implementarías la lógica de parsing CSV
      // Por simplicidad, asumo formato: name,player1_name,player2_name,group_number

      res.json({
        message: 'CSV importado exitosamente (funcionalidad pendiente de implementar)',
        file: req.file.originalname
      });
    } catch (error) {
      next(error);
    }
  }
}