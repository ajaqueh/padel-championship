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