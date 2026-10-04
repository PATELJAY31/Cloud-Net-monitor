import { Router } from 'express';
import { getCurrentUser, login, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { loginSchema, registerSchema } from '../validators/authSchemas.js';

export const authRoutes = Router();

authRoutes.post('/register', validateBody(registerSchema), register);
authRoutes.post('/login', validateBody(loginSchema), login);
authRoutes.get('/me', requireAuth, getCurrentUser);
