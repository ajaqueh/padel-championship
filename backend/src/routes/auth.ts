// src/routes/auth.ts

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate, schemas } from '../middleware/validation';

const router = Router();

router.post('/register', validate(schemas.register), AuthController.register);
router.post('/login', validate(schemas.login), AuthController.login);
router.post('/refresh', AuthController.refreshToken);

export default router;