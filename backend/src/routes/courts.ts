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