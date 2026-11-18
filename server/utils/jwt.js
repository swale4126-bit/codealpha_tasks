import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn,
      issuer: 'koramarket-api',
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret, {
    issuer: 'koramarket-api',
  });
}
