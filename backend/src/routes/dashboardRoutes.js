import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const dashboardRoutes = Router();

dashboardRoutes.get('/summary', requireAuth, getDashboardSummary);
