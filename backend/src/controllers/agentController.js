import crypto from 'node:crypto';
import { config } from '../config/env.js';
import { AgentCredential, Device } from '../models/index.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';

export const registerAgent = asyncHandler(async (request, response) => {
  if (
    config.agentRegistrationToken &&
    request.get('x-agent-registration-token') !== config.agentRegistrationToken
  ) {
    throw new ApiError(403, 'AGENT_REGISTRATION_TOKEN_INVALID', 'A valid agent registration token is required.');
  }

  ensureDatabaseReady();

  const token = AgentCredential.createPlainToken();
  const tokenHash = await AgentCredential.hashToken(token);
  const agentId = `agent_${crypto.randomBytes(10).toString('hex')}`;

  const device = await Device.create({
    name: request.body.name,
    hostname: request.body.hostname,
    ipAddress: request.body.ipAddress,
    publicIpAddress: request.body.publicIpAddress,
    operatingSystem: request.body.operatingSystem,
    status: 'online',
    source: 'agent',
    agentId,
    lastSeenAt: new Date(),
    networkInterfaces: request.body.networkInterfaces,
  });

  const credential = await AgentCredential.create({
    agentId,
    deviceId: device._id,
    tokenHash,
    label: request.body.label,
    createdBy: request.user._id,
  });

  response.status(201).json({
    success: true,
    data: {
      agent: credential.toClientJSON(),
      device: device.toClientJSON(),
      token,
      tokenNotice: 'Store this token securely. It is shown only once and is required by the CloudNet Agent.',
    },
  });
});

export const heartbeat = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const device = await Device.findById(request.agentCredential.deviceId);

  if (device) {
    device.status = request.body.status;
    device.lastSeenAt = new Date();
    if (request.body.hostname) device.hostname = request.body.hostname;
    if (request.body.ipAddress) device.ipAddress = request.body.ipAddress;
    if (request.body.operatingSystem) device.operatingSystem = request.body.operatingSystem;
    await device.save();
  }

  response.json({
    success: true,
    data: {
      agent: request.agentCredential.toClientJSON(),
      device: device?.toClientJSON(),
      heartbeatAt: new Date().toISOString(),
    },
  });
});
