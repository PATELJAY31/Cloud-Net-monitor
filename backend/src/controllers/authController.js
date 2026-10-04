import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signAccessToken } from '../utils/auth.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';

function authPayload(user) {
  return {
    user: user.toSafeJSON(),
    token: signAccessToken(user),
  };
}

export const register = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const existingUser = await User.findOne({ email: request.body.email });

  if (existingUser) {
    throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists.');
  }

  const passwordHash = await User.hashPassword(request.body.password);
  const user = await User.create({
    name: request.body.name,
    email: request.body.email,
    passwordHash,
  });

  return response.status(201).json({
    success: true,
    data: authPayload(user),
  });
});

export const login = asyncHandler(async (request, response) => {
  ensureDatabaseReady();

  const user = await User.findOne({ email: request.body.email }).select('+passwordHash');

  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  const passwordMatches = await user.comparePassword(request.body.password);

  if (!passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  return response.json({
    success: true,
    data: authPayload(user),
  });
});

export const getCurrentUser = asyncHandler(async (request, response) => {
  return response.json({
    success: true,
    data: {
      user: request.user.toSafeJSON(),
    },
  });
});
