import { Alert } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';

export const listAlerts = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const { deviceId, limit, page, read, resolved, severity, type } = request.query;
  const filter = {};

  if (deviceId) filter.deviceId = deviceId;
  if (severity) filter.severity = severity;
  if (type) filter.type = type;
  if (typeof read === 'boolean') filter.read = read;
  if (typeof resolved === 'boolean') filter.resolved = resolved;

  const skip = (page - 1) * limit;
  const [alerts, total] = await Promise.all([
    Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    Alert.countDocuments(filter),
  ]);

  response.json({
    success: true,
    data: {
      alerts: alerts.map((alert) => alert.toClientJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const patchAlert = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const update = {
    ...request.body,
  };

  if (request.body.read === true) update.readAt = new Date();
  if (request.body.read === false) update.readAt = undefined;
  if (request.body.resolved === true) update.resolvedAt = new Date();
  if (request.body.resolved === false) update.resolvedAt = undefined;

  const alert = await Alert.findByIdAndUpdate(request.params.id, update, {
    new: true,
    runValidators: true,
  });

  if (!alert) {
    throw new ApiError(404, 'ALERT_NOT_FOUND', 'The requested alert was not found.');
  }

  response.json({
    success: true,
    data: {
      alert: alert.toClientJSON(),
    },
  });
});
