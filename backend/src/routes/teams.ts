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