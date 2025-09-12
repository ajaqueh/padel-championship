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

// src/middleware/validation.ts

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(`Validación fallida: ${errorMessage}`, 400));
    }
    
    next();
  };
};

// Esquemas de validación
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required(),
    role: Joi.string().valid('admin', 'gestor').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  championship: Joi.object({
    name: Joi.string().min(2).required(),
    format: Joi.string().valid('liga', 'torneo', 'americano').required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().optional(),
    num_groups: Joi.number().integer().min(1).default(1),
    points_win: Joi.number().integer().min(0).default(3),
    points_loss: Joi.number().integer().min(0).default(0)
  }),

  team: Joi.object({
    name: Joi.string().min(2).required(),
    player1_name: Joi.string().min(2).required(),
    player2_name: Joi.string().min(2).required(),
    group_number: Joi.number().integer().min(1).default(1)
  }),

  match: Joi.object({
    team1_id: Joi.number().integer().required(),
    team2_id: Joi.number().integer().required(),
    court_id: Joi.number().integer().optional(),
    round: Joi.number().integer().min(1).required(),
    group_number: Joi.number().integer().min(1).default(1),
    scheduled_date: Joi.date().optional()
  }),

  matchResult: Joi.object({
    sets: Joi.array().items(
      Joi.object({
        team1_games: Joi.number().integer().min(0).required(),
        team2_games: Joi.number().integer().min(0).required()
      })
    ).min(1).max(5).required()
  }),

  court: Joi.object({
    name: Joi.string().min(2).required(),
    is_active: Joi.boolean().default(true)
  })
};

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

// src/middleware/notFound.ts

import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Ruta no encontrada: ${req.method} ${req.path}`
  });
};

// src/routes/auth.ts

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate, schemas } from '../middleware/validation';

const router = Router();

router.post('/register', validate(schemas.register), AuthController.register);
router.post('/login', validate(schemas.login), AuthController.login);
router.post('/refresh', AuthController.refreshToken);

export default router;

// src/routes/championships.ts

import { Router } from 'express';
import { ChampionshipController } from '../controllers/championshipController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Proteger todas las rutas
router.use(authenticate);

router.get('/', ChampionshipController.getAll);
router.get('/:id', ChampionshipController.getById);
router.get('/:id/standings', ChampionshipController.getStandings);

// Solo admin y gestor pueden crear/modificar
router.post('/', 
  authorize('admin', 'gestor'), 
  validate(schemas.championship), 
  ChampionshipController.create
);

router.put('/:id', 
  authorize('admin', 'gestor'), 
  ChampionshipController.update
);

router.delete('/:id', 
  authorize('admin', 'gestor'), 
  ChampionshipController.delete
);

router.post('/:id/generate-fixtures', 
  authorize('admin', 'gestor'), 
  ChampionshipController.generateFixtures
);

export default router;

// src/routes/teams.ts

import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Proteger todas las rutas
router.use(authenticate);

router.get('/championships/:championshipId/teams', TeamController.getByChampionship);

// Solo admin y gestor pueden crear/modificar
router.post('/championships/:championshipId/teams', 
  authorize('admin', 'gestor'), 
  validate(schemas.team), 
  TeamController.create
);

router.put('/:id', 
  authorize('admin', 'gestor'), 
  TeamController.update
);

router.delete('/:id', 
  authorize('admin', 'gestor'), 
  TeamController.delete
);

router.post('/championships/:championshipId/import-csv', 
  authorize('admin', 'gestor'), 
  upload.single('csv'), 
  TeamController.importCSV
);

export default router;

// src/routes/matches.ts

import { Router } from 'express';
import { MatchController } from '../controllers/matchController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Proteger todas las rutas
router.use(authenticate);

router.get('/championships/:championshipId/matches', MatchController.getByChampionship);
router.get('/:id', MatchController.getById);

// Solo admin y gestor pueden crear/modificar
router.post('/', 
  authorize('admin', 'gestor'), 
  validate(schemas.match), 
  MatchController.create
);

router.put('/:id', 
  authorize('admin', 'gestor'), 
  MatchController.update
);

router.delete('/:id', 
  authorize('admin', 'gestor'), 
  MatchController.delete
);

router.post('/:id/result', 
  authorize('admin', 'gestor'), 
  validate(schemas.matchResult), 
  MatchController.updateResult
);

export default router;

// src/routes/courts.ts

import { Router } from 'express';
import { CourtController } from '../controllers/courtController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Proteger todas las rutas
router.use(authenticate);

router.get('/', CourtController.getAll);
router.get('/:id', CourtController.getById);

// Solo admin y gestor pueden crear/modificar
router.post('/', 
  authorize('admin', 'gestor'), 
  validate(schemas.court), 
  CourtController.create
);

router.put('/:id', 
  authorize('admin', 'gestor'), 
  CourtController.update
);

router.delete('/:id', 
  authorize('admin', 'gestor'), 
  CourtController.delete
);

export default router;