import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AppError } from '../lib/errors.js';

export const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const bearerPrefix = 'Bearer ';
  const tokenPrefix = 'Token ';

  let token = null;
  if (authHeader.startsWith(bearerPrefix)) token = authHeader.slice(bearerPrefix.length);
  if (authHeader.startsWith(tokenPrefix)) token = authHeader.slice(tokenPrefix.length);

  if (!token) return next(new AppError(401, 'Missing token'));

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret);
    req.user = { id: Number(decoded.sub), email: decoded.email, role: decoded.role };
    return next();
  } catch {
    return next(new AppError(401, 'Invalid token'));
  }
};
