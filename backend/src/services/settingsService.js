import { Settings, DEFAULT_SETTINGS_KEY } from '../models/Settings.js';

export async function getOrCreateSettings() {
  const existing = await Settings.findOne({ key: DEFAULT_SETTINGS_KEY });

  if (existing) {
    return existing;
  }

  return Settings.create(Settings.getDefaults());
}
