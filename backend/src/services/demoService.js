import { Alert, Device, Metric, Settings } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { getOrCreateSettings } from './settingsService.js';

const demoDevices = [
  {
    name: 'Demo Gateway',
    hostname: 'demo-gateway.local',
    ipAddress: '192.168.10.1',
    operatingSystem: 'RouterOS',
    status: 'online',
  },
  {
    name: 'Demo Web Server',
    hostname: 'demo-web-01.local',
    ipAddress: '192.168.10.20',
    operatingSystem: 'Ubuntu Server',
    status: 'online',
  },
  {
    name: 'Demo Workstation',
    hostname: 'demo-client-01.local',
    ipAddress: '192.168.10.42',
    operatingSystem: 'Windows 11',
    status: 'degraded',
  },
  {
    name: 'Demo Database Node',
    hostname: 'demo-db-01.local',
    ipAddress: '192.168.10.30',
    operatingSystem: 'Debian Linux',
    status: 'offline',
  },
];

function metricFor(deviceIndex, sampleIndex, timestamp) {
  const wave = Math.sin(sampleIndex / 3 + deviceIndex);
  const latencyMs = Math.round(20 + deviceIndex * 18 + Math.abs(wave) * 35);
  const uploadMbps = Number((4 + deviceIndex * 2 + Math.abs(wave) * 6).toFixed(2));
  const downloadMbps = Number((18 + deviceIndex * 9 + Math.abs(wave) * 16).toFixed(2));
  const packetsSent = 900 + sampleIndex * 18 + deviceIndex * 240;
  const packetsReceived = packetsSent - (deviceIndex === 2 ? 24 : deviceIndex * 3);
  const packetLossPercent = Number((((packetsSent - packetsReceived) / packetsSent) * 100).toFixed(2));

  return {
    timestamp,
    latencyMs,
    uploadMbps,
    downloadMbps,
    packetsSent,
    packetsReceived,
    packetLossPercent,
    jitterMs: Number((Math.abs(wave) * 7).toFixed(2)),
    intervalSeconds: 300,
    source: 'demo',
  };
}

export async function seedDemoData() {
  await getOrCreateSettings();
  const seededDevices = [];

  for (const [index, template] of demoDevices.entries()) {
    const device = await Device.findOneAndUpdate(
      { hostname: template.hostname, source: 'demo' },
      {
        ...template,
        source: 'demo',
        agentId: `demo-${index + 1}`,
        lastSeenAt: template.status === 'offline' ? new Date(Date.now() - 12 * 60 * 1000) : new Date(),
        networkInterfaces: [
          {
            name: 'demo0',
            ipAddress: template.ipAddress,
            family: 'IPv4',
          },
        ],
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await Metric.deleteMany({ deviceId: device._id, source: 'demo' });

    const now = Date.now();
    const metrics = Array.from({ length: 48 }, (_unused, sampleIndex) =>
      metricFor(index, sampleIndex, new Date(now - (47 - sampleIndex) * 5 * 60 * 1000)),
    ).map((metric) => ({ ...metric, deviceId: device._id }));

    await Metric.insertMany(metrics);
    const latest = metrics.at(-1);
    device.latestMetrics = {
      latencyMs: latest.latencyMs,
      uploadMbps: latest.uploadMbps,
      downloadMbps: latest.downloadMbps,
      packetsSent: latest.packetsSent,
      packetsReceived: latest.packetsReceived,
      packetLossPercent: latest.packetLossPercent,
    };
    await device.save();
    seededDevices.push(device);
  }

  await Alert.deleteMany({ source: 'demo' });
  const settings = await Settings.findOne({ key: 'global' });
  const demoWorkstation = seededDevices.find((device) => device.hostname === 'demo-client-01.local');
  const demoDatabase = seededDevices.find((device) => device.hostname === 'demo-db-01.local');

  await Alert.insertMany([
    {
      type: 'packet_loss',
      severity: 'warning',
      deviceId: demoWorkstation._id,
      message: 'Demo Data: packet loss exceeded the configured threshold on Demo Workstation.',
      thresholdValue: settings.packetLossThresholdPercent,
      measuredValue: 7.8,
      source: 'demo',
    },
    {
      type: 'device_offline',
      severity: 'critical',
      deviceId: demoDatabase._id,
      message: 'Demo Data: Demo Database Node has stopped sending heartbeats.',
      thresholdValue: settings.offlineTimeoutSeconds,
      measuredValue: 720,
      source: 'demo',
    },
  ]);

  return {
    devices: seededDevices,
    metricsCreated: seededDevices.length * 48,
  };
}

export async function simulateDemoScenario({ scenario, deviceId }) {
  const device =
    (deviceId ? await Device.findOne({ _id: deviceId, source: 'demo' }) : null) ??
    (await Device.findOne({ source: 'demo' }).sort({ status: 1, name: 1 }));

  if (!device) {
    throw new ApiError(404, 'DEMO_DEVICE_NOT_FOUND', 'Seed Demo Mode before running a simulation.');
  }

  const settings = await getOrCreateSettings();
  const base = {
    latencyMs: 38,
    uploadMbps: 8,
    downloadMbps: 32,
    packetsSent: 2400,
    packetsReceived: 2394,
    packetLossPercent: 0.25,
    jitterMs: 3,
    intervalSeconds: 60,
    source: 'demo',
  };

  const scenarios = {
    high_latency: {
      metric: { ...base, latencyMs: settings.highLatencyThresholdMs + 95 },
      alert: {
        type: 'high_latency',
        severity: 'critical',
        message: `Demo Data: ${device.name} latency spiked above the configured threshold.`,
        measuredValue: settings.highLatencyThresholdMs + 95,
        thresholdValue: settings.highLatencyThresholdMs,
      },
      status: 'degraded',
    },
    packet_loss: {
      metric: { ...base, packetLossPercent: settings.packetLossThresholdPercent + 8, packetsReceived: 2100 },
      alert: {
        type: 'packet_loss',
        severity: 'critical',
        message: `Demo Data: ${device.name} packet loss exceeded the configured threshold.`,
        measuredValue: settings.packetLossThresholdPercent + 8,
        thresholdValue: settings.packetLossThresholdPercent,
      },
      status: 'degraded',
    },
    high_traffic: {
      metric: { ...base, uploadMbps: settings.trafficThresholdMbps * 0.45, downloadMbps: settings.trafficThresholdMbps * 0.75 },
      alert: {
        type: 'high_traffic',
        severity: 'warning',
        message: `Demo Data: ${device.name} traffic exceeded the configured threshold.`,
        measuredValue: settings.trafficThresholdMbps * 1.2,
        thresholdValue: settings.trafficThresholdMbps,
      },
      status: 'online',
    },
    device_offline: {
      metric: base,
      alert: {
        type: 'device_offline',
        severity: 'critical',
        message: `Demo Data: ${device.name} stopped sending heartbeats.`,
        measuredValue: settings.offlineTimeoutSeconds * 2,
        thresholdValue: settings.offlineTimeoutSeconds,
      },
      status: 'offline',
      lastSeenAt: new Date(Date.now() - settings.offlineTimeoutSeconds * 2000),
    },
    device_online: {
      metric: base,
      alert: {
        type: 'device_offline',
        severity: 'info',
        message: `Demo Data: ${device.name} came back online after an outage simulation.`,
        measuredValue: 0,
        thresholdValue: settings.offlineTimeoutSeconds,
      },
      status: 'online',
    },
  };

  const selected = scenarios[scenario];
  const metric = await Metric.create({
    ...selected.metric,
    deviceId: device._id,
    timestamp: new Date(),
  });

  device.status = selected.status;
  device.lastSeenAt = selected.lastSeenAt ?? metric.timestamp;
  device.latestMetrics = {
    latencyMs: metric.latencyMs,
    uploadMbps: metric.uploadMbps,
    downloadMbps: metric.downloadMbps,
    packetsSent: metric.packetsSent,
    packetsReceived: metric.packetsReceived,
    packetLossPercent: metric.packetLossPercent,
  };
  await device.save();

  const alert = await Alert.create({
    ...selected.alert,
    deviceId: device._id,
    source: 'demo',
  });

  return { device, metric, alert };
}
