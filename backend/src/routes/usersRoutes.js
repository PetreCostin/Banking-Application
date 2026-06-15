import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { get } from '../db/client.js';
import { listActiveSessions, revokeAllUserTokens } from '../services/authService.js';
import { writeAuditLog } from '../services/auditService.js';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await get('SELECT id, email, full_name AS fullName, role, created_at AS createdAt FROM users WHERE id = ?', [
      req.user.id,
    ]);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const sessions = await listActiveSessions({ userId: req.user.id });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

router.delete('/sessions', requireAuth, async (req, res, next) => {
  try {
    await revokeAllUserTokens({ userId: req.user.id });
    await writeAuditLog({
      actorUserId: req.user.id,
      action: 'REVOKE_ALL_SESSIONS',
      resourceType: 'user',
      resourceId: String(req.user.id),
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
