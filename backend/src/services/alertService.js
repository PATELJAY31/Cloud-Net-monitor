import { Alert } from '../models/Alert.js';
import { getOrCreateSettings } from './settingsService.js';

const ALERT_COOLDOWN_MS = 10 * 60 * 1000;

function severityForRatio(ratio) {
  if (ratio >= 1.5) {
    return 'critical';
  }

  if (ratio >= 1) {
    return 'warning';
  }

  return 'info';
}

async function createAlertIfNeeded({ device, type, severity, message, measuredValue, thresholdValue, source }) {
  const recentDuplicate = await Alert.findOne({
    deviceId: device._id,
    type,
    resolved: false,
    timestamp: { $gte: new Date(Date.now() - ALERT_COOLDOWN_MS) },
  });

  if (recentDuplicate) {
    return null;
  }

  return Alert.create({
    deviceId: device._id,
    type,
    severity,
    message,
    measuredValue,
    thresholdValue,
    source,
  });
}

export async function evaluateMetricAlerts(device, metric) {
  const settings = await getOrCreateSettings();
  const createdAlerts = [];

  if (metric.latencyMs > settings.highLatencyThresholdMs) {
    const alert = await createAlertIfNeeded({
      device,
      type: 'high_latency',
      severity: severityForRatio(metric.latencyMs / settings.highLatencyThresholdMs),
      message: `${device.name} latency is ${metric.latencyMs} ms, above the ${settings.highLatencyThresholdMs} ms threshold.`,
      measuredValue: metric.latencyMs,
      thresholdValue: settings.highLatencyThresholdMs,
      source: metric.source,
    });
    if (alert) createdAlerts.push(alert);
  }

  if (metric.packetLossPercent > settings.packetLossThresholdPercent) {
    const alert = await createAlertIfNeeded({
      device,
      type: 'packet_loss',
      severity: severityForRatio(metric.packetLossPercent / settings.packetLossThresholdPercent),
      message: `${device.name} packet loss is ${metric.packetLossPercent}%, above the ${settings.packetLossThresholdPercent}% threshold.`,
      measuredValue: metric.packetLossPercent,
      thresholdValue: settings.packetLossThresholdPercent,
      source: metric.source,
    });
    if (alert) createdAlerts.push(alert);
  }

  const totalTraffic = metric.uploadMbps + metric.downloadMbps;
  if (totalTraffic > settings.trafficThresholdMbps) {
    const alert = await createAlertIfNeeded({
      device,
      type: 'high_traffic',
      severity: severityForRatio(totalTraffic / settings.trafficThresholdMbps),
      message: `${device.name} traffic is ${totalTraffic.toFixed(2)} Mbps, above the ${settings.trafficThresholdMbps} Mbps threshold.`,
      measuredValue: totalTraffic,
      thresholdValue: settings.trafficThresholdMbps,
      source: metric.source,
    });
    if (alert) createdAlerts.push(alert);
  }

  return createdAlerts;
}
