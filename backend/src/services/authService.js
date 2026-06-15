import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { all, get, run } from '../db/client.js';
import env from '../config/env.js';
import { AppError } from '../lib/errors.js';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const expirationFromTtl = (ttl, now = Date.now()) => {
  const suffix = String(ttl).slice(-1);
  const value = Number(String(ttl).slice(0, -1));
  if (suffix === 'd') return new Date(now + value * 24 * 60 * 60 * 1000).toISOString();
  if (suffix === 'h') return new Date(now + value * 60 * 60 * 1000).toISOString();
  if (suffix === 'm') return new Date(now + value * 60 * 1000).toISOString();
  return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
};

const buildTokens = async (user) => {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
  const refreshToken = jwt.sign(
    { sub: user.id, tokenType: 'refresh', jti: crypto.randomUUID() },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshTtl },
  );

  await run(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [user.id, sha256(refreshToken), expirationFromTtl(env.jwtRefreshTtl)],
  );

  return { accessToken, refreshToken };
};

export const registerUser = async ({ email, password, fullName }) => {
  const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) throw new AppError(409, 'Email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const insert = await run(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
    [email, passwordHash, fullName, 'customer'],
  );

  const accountNumber = `ACC${String(insert.id).padStart(6, '0')}`;
  await run(
    'INSERT INTO accounts (user_id, account_number, currency, balance) VALUES (?, ?, ?, ?)',
    [insert.id, accountNumber, 'USD', 0],
  );

  const user = await get('SELECT id, email, full_name AS fullName, role FROM users WHERE id = ?', [insert.id]);
  return { user, ...(await buildTokens(user)) };
};

export const loginUser = async ({ email, password }) => {
  const user = await get(
    'SELECT id, email, full_name AS fullName, role, password_hash AS passwordHash FROM users WHERE email = ?',
    [email],
  );

  if (!user) throw new AppError(401, 'Invalid credentials');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  return {
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    ...(await buildTokens(user)),
  };
};

export const refreshUserToken = async ({ refreshToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const tokenHash = sha256(refreshToken);
  const tokenRecord = await get(
    `SELECT id, user_id AS userId, expires_at AS expiresAt, revoked_at AS revokedAt
     FROM refresh_tokens WHERE token_hash = ?`,
    [tokenHash],
  );

  if (!tokenRecord || tokenRecord.revokedAt || new Date(tokenRecord.expiresAt) < new Date()) {
    throw new AppError(401, 'Refresh token expired or revoked');
  }

  await run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?', [tokenRecord.id]);

  const user = await get('SELECT id, email, full_name AS fullName, role FROM users WHERE id = ?', [decoded.sub]);
  if (!user) throw new AppError(401, 'User no longer exists');

  return { user, ...(await buildTokens(user)) };
};

export const revokeRefreshToken = async ({ refreshToken }) => {
  const tokenHash = sha256(refreshToken);
  await run(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL',
    [tokenHash],
  );
};

export const revokeAllUserTokens = async ({ userId }) => {
  await run('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL', [userId]);
};

export const listActiveSessions = async ({ userId }) =>
  all(
    `SELECT id, expires_at AS expiresAt, created_at AS createdAt
     FROM refresh_tokens
     WHERE user_id = ? AND revoked_at IS NULL AND datetime(expires_at) > datetime('now')
     ORDER BY created_at DESC`,
    [userId],
  );
