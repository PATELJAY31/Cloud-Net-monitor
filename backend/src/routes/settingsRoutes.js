import { Router } from 'express';
import { getSettings, patchSettings } from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { settingsPatchBodySchema } from '../validators/settingsSchemas.js';

export const settingsRoutes = Router();

settingsRoutes.get('/', requireAuth, getSettings);
settingsRoutes.patch('/', requireAuth, validateBody(settingsPatchBodySchema), patchSettings);
