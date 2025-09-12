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