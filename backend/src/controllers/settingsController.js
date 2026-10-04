import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';
import { getOrCreateSettings } from '../services/settingsService.js';

export const getSettings = asyncHandler(async (_request, response) => {
  ensureDatabaseReady();

  const settings = await getOrCreateSettings();

  response.json({
    success: true,
    data: {
      settings: settings.toClientJSON(),
    },
  });
});

export const patchSettings = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const settings = await getOrCreateSettings();
  Object.assign(settings, request.body, {
    updatedBy: request.user._id,
  });
  await settings.save();

  response.json({
    success: true,
    data: {
      settings: settings.toClientJSON(),
    },
  });
});
