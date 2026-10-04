import { Router } from 'express';
import { getTopology } from '../controllers/topologyController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const topologyRoutes = Router();

topologyRoutes.get('/', requireAuth, getTopology);
