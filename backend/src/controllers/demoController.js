import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';
import { seedDemoData, simulateDemoScenario } from '../services/demoService.js';

export const seedDemo = asyncHandler(async (_request, response) => {
  ensureDatabaseReady();
  const result = await seedDemoData();

  response.status(201).json({
    success: true,
    data: {
      demo: true,
      devices: result.devices.map((device) => device.toClientJSON()),
      metricsCreated: result.metricsCreated,
      message: 'Demo Data seeded successfully.',
    },
  });
});

export const simulateDemo = asyncHandler(async (request, response) => {
  ensureDatabaseReady();
  const result = await simulateDemoScenario(request.body);

  response.status(201).json({
    success: true,
    data: {
      demo: true,
      device: result.device.toClientJSON(),
      metric: result.metric.toClientJSON(),
      alert: result.alert.toClientJSON(),
      message: 'Demo Data simulation applied.',
    },
  });
});
