// src/controllers/courtController.ts

import { Request, Response, NextFunction } from 'express';
import { pool } from '../types';
import { AppError } from '../types';

export class CourtController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pool.query(
        'SELECT * FROM courts ORDER BY name'
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
        'SELECT * FROM courts WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Cancha no encontrada', 404);
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, is_active = true } = req.body;

      const result = await pool.query(
        'INSERT INTO courts (name, is_active) VALUES ($1, $2) RETURNING *',
        [name, is_active]
      );

      res.status(201).json({
        message: 'Cancha creada exitosamente',
        court: result.rows[0]
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
        `UPDATE courts SET 
         name = COALESCE($1, name),
         is_active = COALESCE($2, is_active)
         WHERE id = $3 RETURNING *`,
        [updateData.name, updateData.is_active, id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Cancha no encontrada', 404);
      }

      res.json({
        message: 'Cancha actualizada exitosamente',
        court: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Verificar que no hay partidos asignados a esta cancha
      const matchesResult = await pool.query(
        'SELECT COUNT(*) FROM matches WHERE court_id = $1',
        [id]
      );

      if (parseInt(matchesResult.rows[0].count) > 0) {
        throw new AppError('No se puede eliminar una cancha con partidos asignados', 400);
      }

      const result = await pool.query(
        'DELETE FROM courts WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Cancha no encontrada', 404);
      }

      res.json({
        message: 'Cancha eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}