import mongoose from 'mongoose';
import { Metric } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';
import { getRangeStart } from '../validators/commonSchemas.js';
import { recordMetricForDevice } from '../services/metricService.js';

export const listMetrics = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const { deviceId, limit, page, range, source } = request.query;
  const filter = {
    timestamp: { $gte: getRangeStart(range) },
  };

  if (deviceId) filter.deviceId = new mongoose.Types.ObjectId(deviceId);
  if (source) filter.source = source;

  const skip = (page - 1) * limit;
  const [metrics, total] = await Promise.all([
    Metric.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    Metric.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: {
      metrics: metrics.reverse().map((metric) => metric.toClientJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const createMetricFromAgent = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const result = await recordMetricForDevice(request.agentCredential.deviceId, request.body, 'agent');

  response.status(201).json({
    success: true,
    data: {
      metric: result.metric.toClientJSON(),
      device: result.device.toClientJSON(),
      alerts: result.alerts.map((alert) => alert.toClientJSON()),
    },
  });
});
