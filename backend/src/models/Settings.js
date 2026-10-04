import mongoose from 'mongoose';

export const DEFAULT_SETTINGS_KEY = 'global';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: DEFAULT_SETTINGS_KEY,
      immutable: true,
    },
    highLatencyThresholdMs: {
      type: Number,
      min: 1,
      default: 150,
    },
    packetLossThresholdPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 5,
    },
    trafficThresholdMbps: {
      type: Number,
      min: 1,
      default: 100,
    },
    offlineTimeoutSeconds: {
      type: Number,
      min: 10,
      default: 180,
    },
    refreshIntervalSeconds: {
      type: Number,
      min: 5,
      max: 3600,
      default: 30,
    },
    theme: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    demoModeEnabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

settingsSchema.statics.getDefaults = function getDefaults() {
  return {
    key: DEFAULT_SETTINGS_KEY,
    highLatencyThresholdMs: 150,
    packetLossThresholdPercent: 5,
    trafficThresholdMbps: 100,
    offlineTimeoutSeconds: 180,
    refreshIntervalSeconds: 30,
    theme: 'system',
    demoModeEnabled: true,
  };
};

settingsSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    highLatencyThresholdMs: this.highLatencyThresholdMs,
    packetLossThresholdPercent: this.packetLossThresholdPercent,
    trafficThresholdMbps: this.trafficThresholdMbps,
    offlineTimeoutSeconds: this.offlineTimeoutSeconds,
    refreshIntervalSeconds: this.refreshIntervalSeconds,
    theme: this.theme,
    demoModeEnabled: this.demoModeEnabled,
    updatedBy: this.updatedBy?.toString(),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Settings = mongoose.models.Settings ?? mongoose.model('Settings', settingsSchema);
