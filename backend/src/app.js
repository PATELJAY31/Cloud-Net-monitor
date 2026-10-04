import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { getDatabaseStatus } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { agentRoutes } from './routes/agentRoutes.js';
import { alertRoutes } from './routes/alertRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { demoRoutes } from './routes/demoRoutes.js';
import { deviceRoutes } from './routes/deviceRoutes.js';
import { metricRoutes } from './routes/metricRoutes.js';
import { settingsRoutes } from './routes/settingsRoutes.js';
import { topologyRoutes } from './routes/topologyRoutes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS origin not allowed: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/', (_request, response) => {
    response.json({
      success: true,
      name: 'CloudNet Monitor API',
      health: '/api/health',
    });
  });

  app.get('/api/health', (_request, response) => {
    response.json({
      success: true,
      status: 'connected',
      message: 'CloudNet Monitor API is running',
      database: getDatabaseStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/demo', demoRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/agents', agentRoutes);
  app.use('/api/metrics', metricRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/topology', topologyRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
