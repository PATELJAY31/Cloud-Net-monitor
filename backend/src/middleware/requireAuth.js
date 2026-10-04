import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/auth.js';

export const requireAuth = asyncHandler(async (request, _response, next) => {
  const authorization = request.get('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'AUTH_TOKEN_MISSING', 'A valid Bearer token is required.');
  }

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(401, 'AUTH_USER_NOT_FOUND', 'The authenticated user no longer exists.');
  }

  request.user = user;
  return next();
});
