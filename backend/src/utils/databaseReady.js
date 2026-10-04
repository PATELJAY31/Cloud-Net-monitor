import mongoose from 'mongoose';
import { ApiError } from './apiError.js';

export function ensureDatabaseReady() {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(
      503,
      'DATABASE_UNAVAILABLE',
      'MongoDB is not connected. Configure MONGODB_URI and start MongoDB before using this API.',
    );
  }
}
