import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const skipInTest = () => env.nodeEnv === 'test' || Boolean(process.env.NODE_TEST_CONTEXT);

export const apiRateLimiter = rateLimit({
  windowMs: env.security.rateLimitWindowMs,
  max: env.security.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
  },
});
