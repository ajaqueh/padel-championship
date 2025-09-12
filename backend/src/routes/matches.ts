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