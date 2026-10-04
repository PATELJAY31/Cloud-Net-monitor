import { Device } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';

export const getTopology = asyncHandler(async (_request, response) => {
  ensureDatabaseReady();

  const devices = await Device.find().sort({ name: 1 });
  const cloudNode = {
    id: 'cloud',
    type: 'cloud',
    label: 'Internet / Cloud',
    status: 'online',
  };
  const routerNode = {
    id: 'network-router',
    type: 'router',
    label: 'Network / Router',
    status: devices.some((device) => device.status === 'offline') ? 'degraded' : 'online',
  };
  const deviceNodes = devices.map((device) => ({
    id: device._id.toString(),
    type: 'device',
    label: device.name,
    hostname: device.hostname,
    ipAddress: device.ipAddress,
    status: device.status,
    source: device.source,
  }));

  response.json({
    success: true,
    data: {
      note: 'Topology shows registered/known monitored devices. It does not claim automatic physical network discovery.',
      nodes: [cloudNode, routerNode, ...deviceNodes],
      edges: [
        { id: 'cloud-router', source: 'cloud', target: 'network-router' },
        ...deviceNodes.map((node) => ({
          id: `router-${node.id}`,
          source: 'network-router',
          target: node.id,
        })),
      ],
    },
  });
});
