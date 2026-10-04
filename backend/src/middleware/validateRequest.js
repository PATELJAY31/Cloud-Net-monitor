import { ApiError } from '../utils/apiError.js';

export function validateBody(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Request body validation failed.',
          result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
    }

    request.body = result.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Query validation failed.',
          result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
    }

    request.query = result.data;
    return next();
  };
}

export function validateParams(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      return next(
        new ApiError(
          400,
          'VALIDATION_ERROR',
          'Route parameter validation failed.',
          result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
    }

    request.params = result.data;
    return next();
  };
}
