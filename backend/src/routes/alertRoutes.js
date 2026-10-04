import { Router } from 'express';
import { listAlerts, patchAlert } from '../controllers/alertController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js';
import { alertIdParamsSchema, alertListQuerySchema, alertPatchBodySchema } from '../validators/alertSchemas.js';

export const alertRoutes = Router();

alertRoutes.get('/', requireAuth, validateQuery(alertListQuerySchema), listAlerts);
alertRoutes.patch('/:id', requireAuth, validateParams(alertIdParamsSchema), validateBody(alertPatchBodySchema), patchAlert);
