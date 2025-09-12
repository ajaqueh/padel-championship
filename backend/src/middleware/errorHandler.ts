// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  // PostgreSQL errors
  if (error.name === 'DatabaseError' || (error as any).code) {
    const pgError = error as any;
    
    switch (pgError.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          status: 'error',
          message: 'Ya existe un registro con estos datos'
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          status: 'error',
          message: 'Referencia inválida a otro registro'
        });
      case '23514': // check_violation
        return res.status(400).json({
          status: 'error',
          message: 'Los datos no cumplen las restricciones'
        });
      default:
        console.error('Database Error:', pgError);
        return res.status(500).json({
          status: 'error',
          message: 'Error de base de datos'
        });
    }
  }

  // Unexpected errors
  console.error('Unexpected Error:', error);
  
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor'
  });
};