import mongoose from 'mongoose';

function refToString(ref) {
  return ref?._id ? ref._id.toString() : ref?.toString();
}

const metricSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    latencyMs: {
      type: Number,
      min: 0,
      default: 0,
    },
    uploadMbps: {
      type: Number,
      min: 0,
      default: 0,
    },
    downloadMbps: {
      type: Number,
      min: 0,
      default: 0,
    },
    packetsSent: {
      type: Number,
      min: 0,
      default: 0,
    },
    packetsReceived: {
      type: Number,
      min: 0,
      default: 0,
    },
    packetLossPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    jitterMs: {
      type: Number,
      min: 0,
      default: 0,
    },
    intervalSeconds: {
      type: Number,
      min: 1,
      default: 60,
    },
    source: {
      type: String,
      enum: ['agent', 'demo'],
      default: 'agent',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

metricSchema.index({ deviceId: 1, timestamp: -1 });
metricSchema.index({ timestamp: -1 });
metricSchema.index({ source: 1, timestamp: -1 });

metricSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    deviceId: refToString(this.deviceId),
    timestamp: this.timestamp,
    latencyMs: this.latencyMs,
    uploadMbps: this.uploadMbps,
    downloadMbps: this.downloadMbps,
    packetsSent: this.packetsSent,
    packetsReceived: this.packetsReceived,
    packetLossPercent: this.packetLossPercent,
    jitterMs: this.jitterMs,
    intervalSeconds: this.intervalSeconds,
    source: this.source,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Metric = mongoose.models.Metric ?? mongoose.model('Metric', metricSchema);
