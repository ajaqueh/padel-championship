// src/middleware/notFound.ts

import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.method} ${req.path}`
  });
};