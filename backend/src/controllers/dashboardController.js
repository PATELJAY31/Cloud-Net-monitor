import { Alert, Device, Metric } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';

export const getDashboardSummary = asyncHandler(async (_request, response) => {
  ensureDatabaseReady();

  const [totalDevices, onlineDevices, offlineDevices, degradedDevices, recentMetrics, recentAlerts, recentDevices] =
    await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ status: 'online' }),
      Device.countDocuments({ status: 'offline' }),
      Device.countDocuments({ status: 'degraded' }),
      Metric.find().sort({ timestamp: -1 }).limit(60),
      Alert.find().sort({ timestamp: -1 }).limit(8).populate('deviceId', 'name hostname ipAddress status'),
      Device.find().sort({ updatedAt: -1 }).limit(8),
    ]);

  const totals = recentMetrics.reduce(
    (accumulator, metric) => ({
      latencyMs: accumulator.latencyMs + metric.latencyMs,
      uploadMbps: accumulator.uploadMbps + metric.uploadMbps,
      downloadMbps: accumulator.downloadMbps + metric.downloadMbps,
      packetLossPercent: accumulator.packetLossPercent + metric.packetLossPercent,
    }),
    {
      latencyMs: 0,
      uploadMbps: 0,
      downloadMbps: 0,
      packetLossPercent: 0,
    },
  );
  const divisor = recentMetrics.length || 1;

  response.json({
    success: true,
    data: {
      summary: {
        totalDevices,
        onlineDevices,
        offlineDevices,
        degradedDevices,
        averageLatencyMs: Number((totals.latencyMs / divisor).toFixed(2)),
        uploadMbps: Number(totals.uploadMbps.toFixed(2)),
        downloadMbps: Number(totals.downloadMbps.toFixed(2)),
        packetLossPercent: Number((totals.packetLossPercent / divisor).toFixed(2)),
      },
      recentMetrics: recentMetrics.reverse().map((metric) => metric.toClientJSON()),
      recentAlerts: recentAlerts.map((alert) => alert.toClientJSON()),
      recentDevices: recentDevices.map((device) => device.toClientJSON()),
      networkStatus:
        offlineDevices > 0 ? 'attention_required' : degradedDevices > 0 ? 'degraded' : totalDevices > 0 ? 'healthy' : 'empty',
    },
  });
});
