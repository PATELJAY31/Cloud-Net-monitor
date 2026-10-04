import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Enter a valid MongoDB ObjectId.');

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  page: z.coerce.number().int().min(1).default(1),
});

export const timeRangeQuerySchema = z.object({
  range: z.enum(['15m', '1h', '24h', '7d']).default('1h'),
});

export function getRangeStart(range) {
  const now = Date.now();
  const durationMs = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  }[range];

  return new Date(now - durationMs);
}
