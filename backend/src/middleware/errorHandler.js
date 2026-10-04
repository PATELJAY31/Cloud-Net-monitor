import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';

export function notFoundHandler(_request, response) {
  response.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested CloudNet API route does not exist yet.',
    },
  });
}

export function errorHandler(error, _request, response, _next) {
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Request body must be valid JSON.',
      },
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  if (error instanceof mongoose.Error || error.name === 'MongoServerError') {
    return response.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'MongoDB is not available. Configure MONGODB_URI and ensure the database is running.',
      },
    });
  }

  console.error(error);

  return response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
}
