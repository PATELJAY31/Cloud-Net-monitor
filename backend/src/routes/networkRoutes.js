import { Router } from 'express';
import { analyze, ping } from '../controllers/networkController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { analyzeTargetSchema } from '../validators/networkSchemas.js';

export const networkRoutes = Router();

networkRoutes.get('/ping', ping);
networkRoutes.post('/analyze', requireAuth, validateBody(analyzeTargetSchema), analyze);
