import mongoose from 'mongoose';

function refToString(ref) {
  return ref?._id ? ref._id.toString() : ref?.toString();
}

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['high_latency', 'packet_loss', 'device_offline', 'high_traffic'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
      index: true,
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['agent', 'demo', 'system'],
      default: 'system',
      index: true,
    },
    measuredValue: {
      type: Number,
    },
    thresholdValue: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

alertSchema.index({ deviceId: 1, timestamp: -1 });
alertSchema.index({ read: 1, severity: 1, timestamp: -1 });
alertSchema.index({ type: 1, resolved: 1, timestamp: -1 });

alertSchema.pre('save', function setStateTimestamps(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }

  if (this.isModified('resolved') && this.resolved && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  next();
});

alertSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    type: this.type,
    severity: this.severity,
    deviceId: refToString(this.deviceId),
    device:
      this.deviceId && typeof this.deviceId === 'object' && this.deviceId.name
        ? {
            id: this.deviceId._id.toString(),
            name: this.deviceId.name,
            hostname: this.deviceId.hostname,
            ipAddress: this.deviceId.ipAddress,
            status: this.deviceId.status,
          }
        : undefined,
    message: this.message,
    timestamp: this.timestamp,
    read: this.read,
    readAt: this.readAt,
    resolved: this.resolved,
    resolvedAt: this.resolvedAt,
    source: this.source,
    measuredValue: this.measuredValue,
    thresholdValue: this.thresholdValue,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Alert = mongoose.models.Alert ?? mongoose.model('Alert', alertSchema);
