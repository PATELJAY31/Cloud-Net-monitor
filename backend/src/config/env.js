import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  corsOrigins: [
    ...(process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    'http://127.0.0.1:5173',
  ],
  agentRegistrationToken: process.env.AGENT_REGISTRATION_TOKEN ?? '',
};
