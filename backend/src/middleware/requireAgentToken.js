import { AgentCredential } from '../models/AgentCredential.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureDatabaseReady } from '../utils/databaseReady.js';

export const requireAgentToken = asyncHandler(async (request, _response, next) => {
  const authorization = request.get('authorization') ?? '';
  const [, bearerToken] = authorization.split(' ');
  const token = request.get('x-agent-token') ?? bearerToken;

  if (!token) {
    throw new ApiError(401, 'AGENT_TOKEN_MISSING', 'A valid agent token is required.');
  }

  ensureDatabaseReady();

  const credentials = await AgentCredential.find({ active: true }).select('+tokenHash');
  const matchChecks = await Promise.all(
    credentials.map(async (credential) => ({
      credential,
      matches: await credential.compareToken(token),
    })),
  );
  const match = matchChecks.find((check) => check.matches);

  if (!match) {
    throw new ApiError(401, 'AGENT_TOKEN_INVALID', 'The supplied agent token is invalid.');
  }

  match.credential.lastUsedAt = new Date();
  await match.credential.save();
  request.agentCredential = match.credential;
  return next();
});
