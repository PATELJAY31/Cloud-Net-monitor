import { z } from 'zod';

export const demoSimulationSchema = z.object({
  scenario: z.enum(['high_latency', 'packet_loss', 'high_traffic', 'device_offline', 'device_online']),
  deviceId: z.string().regex(/^[a-f\d]{24}$/i, 'Enter a valid MongoDB ObjectId.').optional(),
});
