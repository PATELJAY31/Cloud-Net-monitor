import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('bufferCommands', false);

let databaseStatus = {
  status: 'not_configured',
  message: 'MONGODB_URI is not configured.',
};

export async function connectDatabase() {
  if (!config.mongodbUri) {
    return databaseStatus;
  }

  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    databaseStatus = {
      status: 'connected',
      message: 'MongoDB connection is active.',
    };
  } catch (error) {
    databaseStatus = {
      status: 'disconnected',
      message: error.message,
    };
  }

  return databaseStatus;
}

export function getDatabaseStatus() {
  return databaseStatus;
}

mongoose.connection.on('disconnected', () => {
  if (config.mongodbUri) {
    databaseStatus = {
      status: 'disconnected',
      message: 'MongoDB connection is disconnected.',
    };
  }
});

mongoose.connection.on('connected', () => {
  databaseStatus = {
    status: 'connected',
    message: 'MongoDB connection is active.',
  };
});
