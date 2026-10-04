import { z } from 'zod';

export const settingsPatchBodySchema = z
  .object({
    highLatencyThresholdMs: z.number().int().min(1).optional(),
    packetLossThresholdPercent: z.number().min(0).max(100).optional(),
    trafficThresholdMbps: z.number().min(1).optional(),
    offlineTimeoutSeconds: z.number().int().min(10).optional(),
    refreshIntervalSeconds: z.number().int().min(5).max(3600).optional(),
    theme: z.enum(['system', 'light', 'dark']).optional(),
    demoModeEnabled: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'At least one setting is required.');
