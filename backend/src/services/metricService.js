import { Device, Metric } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { evaluateMetricAlerts } from './alertService.js';

export async function recordMetricForDevice(deviceId, body, source = 'agent') {
  const device = await Device.findById(deviceId);

  if (!device) {
    throw new ApiError(404, 'DEVICE_NOT_FOUND', 'The target device does not exist.');
  }

  const metric = await Metric.create({
    deviceId: device._id,
    timestamp: body.timestamp ?? new Date(),
    latencyMs: body.latencyMs,
    uploadMbps: body.uploadMbps,
    downloadMbps: body.downloadMbps,
    packetsSent: body.packetsSent,
    packetsReceived: body.packetsReceived,
    packetLossPercent: body.packetLossPercent,
    jitterMs: body.jitterMs,
    intervalSeconds: body.intervalSeconds,
    source,
  });

  device.status = body.packetLossPercent >= 20 || body.latencyMs >= 500 ? 'degraded' : 'online';
  device.lastSeenAt = metric.timestamp;
  device.latestMetrics = {
    latencyMs: metric.latencyMs,
    uploadMbps: metric.uploadMbps,
    downloadMbps: metric.downloadMbps,
    packetsSent: metric.packetsSent,
    packetsReceived: metric.packetsReceived,
    packetLossPercent: metric.packetLossPercent,
  };
  await device.save();

  const alerts = await evaluateMetricAlerts(device, metric);

  return {
    metric,
    device,
    alerts,
  };
}
