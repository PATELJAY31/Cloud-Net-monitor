import { Router } from 'express';
import { heartbeat, registerAgent } from '../controllers/agentController.js';
import { requireAgentToken } from '../middleware/requireAgentToken.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { agentRegisterBodySchema, heartbeatBodySchema } from '../validators/agentSchemas.js';

export const agentRoutes = Router();

agentRoutes.post('/register', requireAuth, validateBody(agentRegisterBodySchema), registerAgent);
agentRoutes.post('/heartbeat', requireAgentToken, validateBody(heartbeatBodySchema), heartbeat);
