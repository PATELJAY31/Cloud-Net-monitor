import { Router } from 'express';
import { createMetricFromAgent, listMetrics } from '../controllers/metricController.js';
import { requireAgentToken } from '../middleware/requireAgentToken.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody, validateQuery } from '../middleware/validateRequest.js';
import { agentMetricBodySchema, metricListQuerySchema } from '../validators/metricSchemas.js';

export const metricRoutes = Router();

metricRoutes.get('/', requireAuth, validateQuery(metricListQuerySchema), listMetrics);
metricRoutes.post('/', requireAgentToken, validateBody(agentMetricBodySchema), createMetricFromAgent);
