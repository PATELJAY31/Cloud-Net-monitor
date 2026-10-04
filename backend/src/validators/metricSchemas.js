import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema, timeRangeQuerySchema } from './commonSchemas.js';

const metricNumbers = {
  latencyMs: z.number().min(0).default(0),
  uploadMbps: z.number().min(0).default(0),
  downloadMbps: z.number().min(0).default(0),
  packetsSent: z.number().int().min(0).default(0),
  packetsReceived: z.number().int().min(0).default(0),
  packetLossPercent: z.number().min(0).max(100).default(0),
  jitterMs: z.number().min(0).default(0),
  intervalSeconds: z.number().int().min(1).default(60),
};

export const agentMetricBodySchema = z.object({
  timestamp: z.coerce.date().optional(),
  ...metricNumbers,
});

export const metricCreateBodySchema = z.object({
  deviceId: objectIdSchema,
  timestamp: z.coerce.date().optional(),
  source: z.enum(['agent', 'demo']).default('agent'),
  ...metricNumbers,
});

export const metricListQuerySchema = paginationQuerySchema.merge(timeRangeQuerySchema).extend({
  deviceId: objectIdSchema.optional(),
  source: z.enum(['agent', 'demo']).optional(),
});
