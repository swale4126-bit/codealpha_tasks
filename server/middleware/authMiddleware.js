import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { findUserById } from '../models/userModel.js';

/**
 * Verifies the Bearer JWT and attaches the live user record to req.user.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required. Please log in.');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AppError(401, 'Authentication token is missing.');
  }

  const decoded = verifyAccessToken(token);
  const user = await findUserById(decoded.sub);

  if (!user) {
    throw new AppError(401, 'User account no longer exists.');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Your account has been deactivated. Please contact support.');
  }

  req.user = user;
  next();
});

/**
 * Restricts route access to users matching one of the allowed roles (RBAC).
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action.'));
    }

    return next();
  };
}
