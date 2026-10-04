import { Router } from 'express';
import { getDeviceById, listDevices } from '../controllers/deviceController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateParams, validateQuery } from '../middleware/validateRequest.js';
import { deviceIdParamsSchema, deviceListQuerySchema } from '../validators/deviceSchemas.js';

export const deviceRoutes = Router();

deviceRoutes.get('/', requireAuth, validateQuery(deviceListQuerySchema), listDevices);
deviceRoutes.get('/:id', requireAuth, validateParams(deviceIdParamsSchema), getDeviceById);
