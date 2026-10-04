import mongoose from 'mongoose';

const networkInterfaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    macAddress: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    family: {
      type: String,
      enum: ['IPv4', 'IPv6', 'unknown'],
      default: 'unknown',
    },
  },
  {
    _id: false,
  },
);

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    hostname: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 45,
    },
    publicIpAddress: {
      type: String,
      trim: true,
      maxlength: 45,
    },
    operatingSystem: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'degraded'],
      default: 'offline',
      index: true,
    },
    source: {
      type: String,
      enum: ['agent', 'demo', 'manual'],
      default: 'agent',
      index: true,
    },
    agentId: {
      type: String,
      trim: true,
      maxlength: 120,
      sparse: true,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      index: true,
    },
    latestMetrics: {
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
    },
    networkInterfaces: {
      type: [networkInterfaceSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

deviceSchema.index({ hostname: 1, ipAddress: 1 }, { unique: true });
deviceSchema.index({ status: 1, lastSeenAt: -1 });
deviceSchema.index({ source: 1, status: 1 });

deviceSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    hostname: this.hostname,
    ipAddress: this.ipAddress,
    publicIpAddress: this.publicIpAddress,
    operatingSystem: this.operatingSystem,
    status: this.status,
    source: this.source,
    lastSeenAt: this.lastSeenAt,
    latestMetrics: this.latestMetrics,
    networkInterfaces: this.networkInterfaces,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Device = mongoose.models.Device ?? mongoose.model('Device', deviceSchema);
