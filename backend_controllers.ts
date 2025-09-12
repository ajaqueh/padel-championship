// src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../types';
import { AppError, LoginRequest, RegisterRequest, JWTPayload } from '../types';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role }: RegisterRequest = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('El usuario ya existe', 400);
      }

      // Hash de la contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        [email, passwordHash, name, role]
      );

      const user = result.rows[0];

      // Generar JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password }: LoginRequest = req.body;

      // Buscar usuario
      const result = await pool.query(
        'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new AppError('Credenciales inválidas', 401);
      }

      const user = result.rows[0];

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new AppError('Credenciales inválidas', 401);
      }

      // Generar JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      });
    } catch (error) {
      next(error);
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new AppError('Token no proporcionado', 401);
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as JWTPayload;

      // Generar nuevo token
      const newToken = jwt.sign(
        { userId: decoded.userId, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Token renovado',
        token: newToken
      });
    } catch (error) {
      next(error);
    }
  }
}

// src/controllers/championshipController.ts

import { Request, Response, NextFunction } from 'express';
import { pool } from '../types';
import { AppError, CreateChampionshipRequest } from '../types';
import { FixtureService } from '../services/fixtureService';
import { StandingsService } from '../services/standingsService';

export class ChampionshipController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pool.query(
        `SELECT c.*, u.name as created_by_name 
         FROM championships c
         LEFT JOIN users u ON c.created_by = u.id
         ORDER BY c.created_at DESC`
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
        `SELECT c.*, u.name as created_by_name 
         FROM championships c
         LEFT JOIN users u ON c.created_by = u.id
         WHERE c.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Campeonato no encontrado', 404);
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        format,
        start_date,
        end_date,
        num_groups = 1,
        points_win = 3,
        points_loss = 0
      }: CreateChampionshipRequest = req.body;

      const userId = (req as any).user.userId;

      const result = await pool.query(
        `INSERT INTO championships (
          name, format, start_date, end_date, num_groups, 
          points_win, points_loss, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [name, format, start_date, end_date, num_groups, points_win, points_loss, userId]
      );

      res.status(201).json({
        message: 'Campeonato creado exitosamente',
        championship: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar que el campeonato existe
      const existingChampionship = await pool.query(
        'SELECT * FROM championships WHERE id = $1',
        [id]
      );

      if (existingChampionship.rows.length === 0) {
        throw new AppError('Campeonato no encontrado', 404);
      }

      // Construir query de actualización dinámicamente
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      const result = await pool.query(
        `UPDATE championships SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );

      res.json({
        message: 'Campeonato actualizado exitosamente',
        championship: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM championships WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Campeonato no encontrado', 404);
      }

      res.json({
        message: 'Campeonato eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  public static async generateFixtures(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Obtener equipos del campeonato
      const teamsResult = await pool.query(
        'SELECT id, name, group_number FROM teams WHERE championship_id = $1',
        [id]
      );

      if (teamsResult.rows.length < 2) {
        throw new AppError('Se necesitan al menos 2 equipos para generar fixtures', 400);
      }

      // Generar fixtures
      const teams = teamsResult.rows;
      const fixtures = FixtureService.generateRoundRobin(teams);

      // Validar fixtures
      if (!FixtureService.validateFixtures(teams, fixtures)) {
        throw new AppError('Error al generar fixtures válidos', 500);
      }

      // Guardar fixtures en la base de datos
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Eliminar partidos existentes
        await client.query(
          'DELETE FROM matches WHERE championship_id = $1',
          [id]
        );

        // Insertar nuevos partidos
        for (const fixture of fixtures) {
          await client.query(
            `INSERT INTO matches (
              championship_id, team1_id, team2_id, round, group_number
            ) VALUES ($1, $2, $3, $4, $5)`,
            [id, fixture.team1_id, fixture.team2_id, fixture.round, fixture.group_number]
          );
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      res.json({
        message: 'Fixtures generados exitosamente',
        fixtures_count: fixtures.length
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStandings(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const standings = await StandingsService.calculateStandings(parseInt(id));

      res.json({
        standings,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

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