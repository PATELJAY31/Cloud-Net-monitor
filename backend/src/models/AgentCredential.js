import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import mongoose from 'mongoose';

function refToString(ref) {
  return ref?._id ? ref._id.toString() : ref?.toString();
}

const agentCredentialSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

agentCredentialSchema.statics.createPlainToken = function createPlainToken() {
  return `cln_${crypto.randomBytes(32).toString('hex')}`;
};

agentCredentialSchema.statics.hashToken = async function hashToken(token) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(token, salt);
};

agentCredentialSchema.methods.compareToken = function compareToken(token) {
  return bcrypt.compare(token, this.tokenHash);
};

agentCredentialSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    agentId: this.agentId,
    deviceId: refToString(this.deviceId),
    label: this.label,
    active: this.active,
    lastUsedAt: this.lastUsedAt,
    createdBy: refToString(this.createdBy),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const AgentCredential =
  mongoose.models.AgentCredential ?? mongoose.model('AgentCredential', agentCredentialSchema);
