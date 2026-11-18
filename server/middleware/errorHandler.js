import env from '../config/env.js';

function mapKnownError(err) {
  // Operational AppError thrown intentionally by services/middleware
  if (err.isOperational) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors || undefined,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid authentication token' };
  }
  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Authentication token has expired' };
  }

  // Express malformed JSON body error
  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Malformed JSON request body' };
  }

  // PostgreSQL error codes
  if (err.code === '23505') {
    return { statusCode: 409, message: 'A record with that unique value already exists' };
  }
  if (err.code === '23503') {
    return {
      statusCode: 409,
      message: 'Operation blocked by a related database record reference',
    };
  }
  if (err.code === '23514') {
    return { statusCode: 400, message: 'Request violates a database value constraint' };
  }
  if (err.code === '22P02') {
    return { statusCode: 400, message: 'Invalid identifier or parameter format' };
  }

  return {
    statusCode: err.statusCode || 500,
    message: env.nodeEnv === 'production' ? 'Internal server error' : err.message || 'Internal server error',
  };
}

export default function errorHandler(err, _req, res, _next) {
  const mapped = mapKnownError(err);

  if (mapped.statusCode >= 500 && env.nodeEnv !== 'test') {
    console.error('[ERROR]', err);
  }

  const responseBody = {
    success: false,
    message: mapped.message,
  };

  if (mapped.errors) {
    responseBody.errors = mapped.errors;
  }

  if (env.nodeEnv === 'development' && mapped.statusCode >= 500) {
    responseBody.stack = err.stack;
  }

  res.status(mapped.statusCode).json(responseBody);
}
