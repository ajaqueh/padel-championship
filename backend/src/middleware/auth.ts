// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, JWTPayload } from '../types';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('Token de acceso requerido', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Formato de token inválido', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JWTPayload;

    (req as any).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    if (!roles.includes(user.role)) {
      return next(new AppError('No tienes permisos para realizar esta acción', 403));
    }

    next();
  };
};