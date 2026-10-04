import { Router } from 'express';
import { seedDemo, simulateDemo } from '../controllers/demoController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { demoSimulationSchema } from '../validators/demoSchemas.js';

export const demoRoutes = Router();

demoRoutes.post('/seed', requireAuth, seedDemo);
demoRoutes.post('/simulate', requireAuth, validateBody(demoSimulationSchema), simulateDemo);
