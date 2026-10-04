import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './commonSchemas.js';

export const alertIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const alertListQuerySchema = paginationQuerySchema.extend({
  deviceId: objectIdSchema.optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  type: z.enum(['high_latency', 'packet_loss', 'device_offline', 'high_traffic']).optional(),
  read: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  resolved: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export const alertPatchBodySchema = z
  .object({
    read: z.boolean().optional(),
    resolved: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'At least one alert state field is required.');
