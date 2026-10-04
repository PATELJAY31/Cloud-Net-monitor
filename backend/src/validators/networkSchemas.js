import { z } from 'zod';

export const analyzeTargetSchema = z.object({
  target: z.string().trim().min(1, 'Target is required.').max(2048, 'Target is too long.'),
});
