import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ApiError } from './apiError.js';

export function signAccessToken(user) {
  if (!config.jwtSecret) {
    throw new ApiError(500, 'JWT_SECRET_MISSING', 'JWT_SECRET must be configured before authentication can be used.');
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: '8h',
      issuer: 'cloudnet-monitor',
    },
  );
}

export function verifyAccessToken(token) {
  if (!config.jwtSecret) {
    throw new ApiError(500, 'JWT_SECRET_MISSING', 'JWT_SECRET must be configured before authentication can be used.');
  }

  return jwt.verify(token, config.jwtSecret, {
    issuer: 'cloudnet-monitor',
  });
}
