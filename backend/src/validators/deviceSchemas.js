import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from './commonSchemas.js';

export const deviceIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const deviceListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  status: z.enum(['online', 'offline', 'degraded']).optional(),
  source: z.enum(['agent', 'demo', 'manual']).optional(),
});
