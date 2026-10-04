import { analyzeTarget } from '../services/networkAnalysisService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const ping = asyncHandler(async (_request, response) => {
  response.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      serverTime: new Date().toISOString(),
    },
  });
});

export const analyze = asyncHandler(async (request, response) => {
  const result = await analyzeTarget(request.body.target);

  response.json({
    success: true,
    data: result,
  });
});
