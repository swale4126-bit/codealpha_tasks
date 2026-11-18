import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

export default function validateRequest(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const formattedErrors = result.array().map((issue) => ({
    field: issue.path,
    message: issue.msg,
  }));

  return next(new AppError(400, 'Validation failed', formattedErrors));
}
