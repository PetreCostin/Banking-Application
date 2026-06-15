import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { loginUser, refreshUserToken, registerUser, revokeRefreshToken } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { writeAuditLog } from '../services/auditService.js';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(12).max(128),
    fullName: z.string().min(2).max(120),
  }),
  query: z.object({}),
  params: z.object({}),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(12).max(128),
  }),
  query: z.object({}),
  params: z.object({}),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20),
  }),
  query: z.object({}),
  params: z.object({}),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const response = await registerUser(req.validated.body);
    await writeAuditLog({
      actorUserId: response.user.id,
      action: 'REGISTER',
      resourceType: 'user',
      resourceId: String(response.user.id),
    });
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const response = await loginUser(req.validated.body);
    await writeAuditLog({
      actorUserId: response.user.id,
      action: 'LOGIN',
      resourceType: 'user',
      resourceId: String(response.user.id),
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const response = await refreshUserToken(req.validated.body);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAuth, validate(refreshSchema), async (req, res, next) => {
  try {
    await revokeRefreshToken(req.validated.body);
    await writeAuditLog({
      actorUserId: req.user.id,
      action: 'LOGOUT',
      resourceType: 'user',
      resourceId: String(req.user.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
